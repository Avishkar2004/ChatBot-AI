import test, { afterEach } from "node:test";
import assert from "node:assert/strict";
import User from "../models/User.js";
import { register } from "../controllers/authController.js";
import { stubber } from "./helpers/stub.js";

const { stub, restoreAll } = stubber();
afterEach(() => restoreAll());

function mockRes() {
  const res = { statusCode: 200 };
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (body) => {
    res.body = body;
    return res;
  };
  return res;
}

const request = (body) => ({
  body,
  // express-validator reads this; an empty context means "no errors".
  headers: {},
  id: "req-1",
});

/** Stub the `findOne(...).select(...).lean()` chain the controller uses. */
const findOneReturning = (doc) =>
  stub(User, "findOne", () => ({
    select: () => ({ lean: async () => doc }),
  }));

/**
 * The duplicate check used to be `findOne({ email, username })` — an AND match.
 * Reusing an email with a fresh username slipped past it, hit the unique index,
 * and surfaced in the signup form as "Request failed with status code 500".
 */
test("a reused email is refused with a message worth reading", async () => {
  findOneReturning({ email: "taken@example.com", username: "someone_else" });
  const create = stub(User, "create", async () => {
    throw new Error("must not reach the database write");
  });

  const res = mockRes();
  await register(
    request({
      username: "brandnew",
      email: "taken@example.com",
      password: "correct-horse",
    }),
    res,
  );

  assert.equal(res.statusCode, 409);
  assert.match(res.body.message, /already registered/i);
  assert.equal(res.body.field, "email");
  assert.equal(create.calls.length, 0);
});

test("a reused username is reported as a username collision", async () => {
  findOneReturning({ email: "other@example.com", username: "taken" });

  const res = mockRes();
  await register(
    request({
      username: "taken",
      email: "fresh@example.com",
      password: "correct-horse",
    }),
    res,
  );

  assert.equal(res.statusCode, 409);
  assert.match(res.body.message, /taken/i);
  assert.equal(res.body.field, "username");
});

test("a duplicate that races past the pre-check is still a clean 409", async () => {
  findOneReturning(null);
  stub(User, "create", async () => {
    const err = new Error("E11000 duplicate key error");
    err.code = 11000;
    err.keyPattern = { email: 1 };
    throw err;
  });

  const res = mockRes();
  await register(
    request({
      username: "racer",
      email: "taken@example.com",
      password: "correct-horse",
    }),
    res,
  );

  assert.equal(res.statusCode, 409);
  assert.equal(res.body.field, "email");
  assert.doesNotMatch(res.body.message, /E11000/, "no raw driver error leaks out");
});

test("a genuine failure returns a generic 500 with a request id", async () => {
  findOneReturning(null);
  stub(User, "create", async () => {
    throw new Error("connection reset");
  });

  const res = mockRes();
  await register(
    request({
      username: "newuser",
      email: "new@example.com",
      password: "correct-horse",
    }),
    res,
  );

  assert.equal(res.statusCode, 500);
  assert.equal(res.body.requestId, "req-1");
  assert.doesNotMatch(res.body.message, /connection reset/);
});

test("email and username are compared lowercased, like the schema stores them", async () => {
  const queries = stub(User, "findOne", (query) => {
    queries.calls.at(-1).query = query;
    return { select: () => ({ lean: async () => null }) };
  });
  stub(User, "create", async (doc) => ({ _id: "id-1", ...doc }));

  const res = mockRes();
  await register(
    request({
      username: "MixedCase",
      email: "Mixed@Example.com",
      password: "correct-horse",
    }),
    res,
  );

  assert.equal(res.statusCode, 201);
  assert.deepEqual(queries.calls[0][0], {
    $or: [{ email: "mixed@example.com" }, { username: "mixedcase" }],
  });
});
