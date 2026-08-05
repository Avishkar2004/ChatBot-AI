import jwt from "jsonwebtoken";

/** Sign a token the real requireAuth middleware will accept. */
export const signToken = (overrides = {}) =>
  jwt.sign(
    {
      sub: "507f1f77bcf86cd799439011",
      username: "tester",
      email: "user@example.com",
      ...overrides,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1h" },
  );

/** Boot an Express app on an ephemeral port; returns a fetch helper + close(). */
export const listen = async (app) => {
  const server = await new Promise((resolve) => {
    const s = app.listen(0, "127.0.0.1", () => resolve(s));
  });
  const { port } = server.address();

  return {
    url: `http://127.0.0.1:${port}`,
    request: (path, options = {}) =>
      fetch(`http://127.0.0.1:${port}${path}`, options),
    close: () => new Promise((resolve) => server.close(resolve)),
  };
};

/** Minimal req/res doubles for unit-testing middleware in isolation. */
export const mockRes = () => {
  const res = { statusCode: 200, headers: {}, finished: false, listeners: {} };
  res.status = (code) => ((res.statusCode = code), res);
  res.json = (body) => ((res.body = body), res);
  res.send = (body) => ((res.body = body), res);
  res.set = (obj) => (Object.assign(res.headers, obj), res);
  res.setHeader = (k, v) => ((res.headers[k] = v), res);
  res.getHeader = (k) => res.headers[k];
  res.on = (event, fn) => ((res.listeners[event] = fn), res);
  res.emit = (event) => res.listeners[event]?.();
  res.headersSent = false;
  return res;
};
