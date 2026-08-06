import test from "node:test";
import assert from "node:assert/strict";
import { selectContext } from "../routes/chatRoutes.js";

/**
 * Context assembly used to be a flat `slice(-10)`, which is why the assistant
 * lost the thread after five exchanges. These lock in the replacement.
 */

const turns = (count) =>
  Array.from({ length: count }, (_, i) => ({
    role: i % 2 === 0 ? "user" : "assistant",
    content: `message ${i}`,
  }));

test("selectContext keeps far more than the old five-exchange window", () => {
  const selected = selectContext(turns(60), 40, 100000);

  assert.equal(selected.length, 40);
  // The newest turns are the ones that survive, in order.
  assert.equal(selected[0].content, "message 20");
  assert.equal(selected.at(-1).content, "message 59");
});

test("selectContext returns short histories untouched", () => {
  const history = turns(6);
  assert.deepEqual(selectContext(history, 40, 100000), history);
});

test("selectContext stops at the character budget before the message budget", () => {
  const history = [
    { role: "user", content: "a".repeat(500) },
    { role: "assistant", content: "b".repeat(500) },
    { role: "user", content: "c".repeat(500) },
  ];

  const selected = selectContext(history, 40, 1200);

  assert.equal(selected.length, 2, "oldest turn is dropped to fit the budget");
  assert.equal(selected[0].content[0], "b");
  assert.equal(selected[1].content[0], "c");
});

test("selectContext always keeps the newest turn even if it alone overflows", () => {
  const history = [
    { role: "user", content: "old" },
    { role: "user", content: "x".repeat(5000) },
  ];

  const selected = selectContext(history, 40, 100);

  assert.equal(selected.length, 1);
  assert.equal(selected[0].content.length, 5000);
});

test("selectContext handles an empty history", () => {
  assert.deepEqual(selectContext([], 40, 1000), []);
});
