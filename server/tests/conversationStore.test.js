import test, { afterEach } from "node:test";
import assert from "node:assert/strict";
import conversationStore from "../services/conversationStore.js";
import redisCache from "../services/redisCache.js";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import { stubber } from "./helpers/stub.js";

const { stub, restoreAll } = stubber();
afterEach(() => restoreAll());

const IDS = {
  user: "507f1f77bcf86cd799439011",
  project: "507f1f77bcf86cd799439012",
  convo: "507f1f77bcf86cd799439013",
};
const session = { userId: IDS.user, projectId: IDS.project, sessionId: "s-1" };

/** Fake the Mongoose Query chain used by loadHistory. */
const findChain = (docs) => ({
  sort: () => ({ limit: () => ({ lean: async () => docs }) }),
});

// ---------------------------------------------------------------------------
// loadHistory — Redis hot window with a MongoDB fallback
// ---------------------------------------------------------------------------

test("loadHistory serves the Redis hot window without touching MongoDB", async () => {
  const cached = [
    { role: "user", content: "hi" },
    { role: "assistant", content: "hello" },
  ];
  stub(redisCache, "getCachedChatSession", async () => cached);
  const findOne = stub(Conversation, "findOne", async () => {
    throw new Error("MongoDB should not be queried on a cache hit");
  });

  const history = await conversationStore.loadHistory(session);

  assert.deepEqual(history, cached);
  assert.equal(findOne.calls.length, 0);
});

test("loadHistory falls back to MongoDB on a cache miss and rewarms Redis", async () => {
  stub(redisCache, "getCachedChatSession", async () => []);
  const rewarm = stub(redisCache, "cacheChatSession", async () => true);
  stub(Conversation, "findOne", async () => ({ _id: IDS.convo }));

  // Mongo returns newest-first; the store must hand back chronological order.
  stub(Message, "find", () =>
    findChain([
      { role: "assistant", content: "second" },
      { role: "user", content: "first" },
    ]),
  );

  const history = await conversationStore.loadHistory(session);

  assert.deepEqual(history, [
    { role: "user", content: "first" },
    { role: "assistant", content: "second" },
  ]);
  assert.equal(rewarm.calls.length, 1, "cache is repopulated after a miss");
  assert.deepEqual(rewarm.calls[0][1], history);
});

test("loadHistory returns an empty list when the conversation does not exist", async () => {
  stub(redisCache, "getCachedChatSession", async () => []);
  stub(Conversation, "findOne", async () => null);
  const rewarm = stub(redisCache, "cacheChatSession", async () => true);

  assert.deepEqual(await conversationStore.loadHistory(session), []);
  assert.equal(rewarm.calls.length, 0);
});

// ---------------------------------------------------------------------------
// persistExchange — MongoDB is the system of record
// ---------------------------------------------------------------------------

test("persistExchange durably stores both turns with token usage", async () => {
  stub(Conversation, "findOne", async () => null);
  const create = stub(Conversation, "create", async (doc) => ({
    _id: IDS.convo,
    ...doc,
  }));
  const insertMany = stub(Message, "insertMany", async () => []);
  const updateOne = stub(Conversation, "updateOne", async () => ({}));
  const mirrored = stub(redisCache, "addMessageToSession", async () => true);

  await conversationStore.persistExchange(
    { ...session, model: "llama-3.1-8b-instant" },
    "What is Redis?",
    "An in-memory data store.",
    { prompt_tokens: 12, completion_tokens: 7 },
  );

  assert.equal(create.calls.length, 1, "creates the thread on first message");

  const [docs] = insertMany.calls[0];
  assert.equal(docs.length, 2);
  assert.equal(docs[0].role, "user");
  assert.equal(docs[0].content, "What is Redis?");
  assert.equal(docs[1].role, "assistant");
  assert.equal(docs[1].model, "llama-3.1-8b-instant");
  assert.deepEqual(docs[1].tokens, { prompt: 12, completion: 7 });

  // Title is derived from the first user message.
  assert.equal(updateOne.calls[0][1].$set.title, "What is Redis?");
  assert.ok(updateOne.calls[0][1].$set.lastMessageAt instanceof Date);

  // And the hot window is mirrored for the next turn.
  assert.equal(mirrored.calls.length, 2);
});

test("persistExchange survives a missing usage payload (streamed replies)", async () => {
  stub(Conversation, "findOne", async () => ({ _id: IDS.convo, title: "Existing" }));
  const insertMany = stub(Message, "insertMany", async () => []);
  const updateOne = stub(Conversation, "updateOne", async () => ({}));
  stub(redisCache, "addMessageToSession", async () => true);

  await conversationStore.persistExchange(session, "hi", "hello");

  assert.deepEqual(insertMany.calls[0][0][1].tokens, { prompt: 0, completion: 0 });
  // An existing title is never overwritten.
  assert.equal(updateOne.calls[0][1].$set.title, undefined);
});

test("persistExchange truncates very long titles", async () => {
  stub(Conversation, "findOne", async () => ({
    _id: IDS.convo,
    title: "New conversation",
  }));
  stub(Message, "insertMany", async () => []);
  const updateOne = stub(Conversation, "updateOne", async () => ({}));
  stub(redisCache, "addMessageToSession", async () => true);

  await conversationStore.persistExchange(session, "word ".repeat(50), "ok");

  const { title } = updateOne.calls[0][1].$set;
  assert.equal(title.length, 60);
  assert.match(title, /…$/);
});

// ---------------------------------------------------------------------------
// clear
// ---------------------------------------------------------------------------

test("clear removes the thread from MongoDB and Redis", async () => {
  stub(Conversation, "findOne", async () => ({ _id: IDS.convo }));
  const deleteMessages = stub(Message, "deleteMany", async () => ({}));
  const deleteConvo = stub(Conversation, "deleteOne", async () => ({}));
  const clearCache = stub(redisCache, "clearChatSession", async () => true);

  await conversationStore.clear(session);

  assert.deepEqual(deleteMessages.calls[0][0], { conversationId: IDS.convo });
  assert.deepEqual(deleteConvo.calls[0][0], { _id: IDS.convo });
  assert.equal(clearCache.calls.length, 1);
});

test("clear still drops the Redis session when no thread exists", async () => {
  stub(Conversation, "findOne", async () => null);
  const deleteMessages = stub(Message, "deleteMany", async () => ({}));
  const clearCache = stub(redisCache, "clearChatSession", async () => true);

  await conversationStore.clear(session);

  assert.equal(deleteMessages.calls.length, 0);
  assert.equal(clearCache.calls.length, 1);
});
