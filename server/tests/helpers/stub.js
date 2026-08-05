/**
 * Minimal method stubbing that also works for inherited members (Mongoose
 * models get their statics from the Model prototype, which node:test's
 * mock.method cannot restore cleanly).
 *
 * Returns a restore() function; collect them and run them in afterEach.
 */
export const stub = (object, name, implementation) => {
  const own = Object.getOwnPropertyDescriptor(object, name);
  const calls = [];

  const wrapped = (...args) => {
    calls.push(args);
    return implementation(...args);
  };
  wrapped.calls = calls;

  Object.defineProperty(object, name, {
    value: wrapped,
    configurable: true,
    writable: true,
  });

  wrapped.restore = () => {
    if (own) Object.defineProperty(object, name, own);
    else delete object[name];
  };

  return wrapped;
};

/** Collects stubs so a test can undo all of them at once. */
export const stubber = () => {
  const created = [];
  return {
    stub: (object, name, implementation) => {
      const s = stub(object, name, implementation);
      created.push(s);
      return s;
    },
    restoreAll: () => {
      while (created.length) created.pop().restore();
    },
  };
};
