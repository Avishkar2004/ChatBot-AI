import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { requireAuth } from "../middleware/auth.js";

const JWT_SECRET = process.env.JWT_SECRET || "Avishkar";

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

function runRequireAuth(req) {
  const res = mockRes();
  let nextCalled = false;
  requireAuth(req, res, () => {
    nextCalled = true;
  });
  return { res, nextCalled };
}

test("requireAuth rejects requests without a token", () => {
  const { res, nextCalled } = runRequireAuth({ headers: {} });

  assert.equal(res.statusCode, 401);
  assert.equal(res.body.message, "Authorization token missing");
  assert.equal(nextCalled, false);
});

test("requireAuth rejects invalid tokens", () => {
  const { res, nextCalled } = runRequireAuth({
    headers: { authorization: "Bearer not-a-real-token" },
  });

  assert.equal(res.statusCode, 401);
  assert.equal(res.body.message, "Invalid or expired token");
  assert.equal(nextCalled, false);
});

test("requireAuth attaches the user and continues for valid tokens", () => {
  const payload = {
    sub: "user-123",
    email: "test@example.com",
    username: "testuser",
  };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
  const req = { headers: { authorization: `Bearer ${token}` } };
  const { res, nextCalled } = runRequireAuth(req);

  assert.equal(res.statusCode, 200);
  assert.equal(nextCalled, true);
  assert.deepEqual(req.user, {
    id: "user-123",
    email: "test@example.com",
    username: "testuser",
  });
});
