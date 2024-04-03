import { assert, test } from "vitest";
import { Signal } from "signal-polyfill";

export function assertStable(access: () => unknown) {
  let calls = 0;

  const computed = new Signal.Computed(() => {
    calls++;
    return access();
  });

  computed.get();
  assert.equal(calls, 1);
  computed.get();
  assert.equal(calls, 1);
}

export function assertReactivelySettled(options: {
  access: () => unknown;
  change: () => unknown;
}) {
  let { access, change } = options;

  let calls = 0;

  const computed = new Signal.Computed(() => {
    calls++;
    return access();
  });

  computed.get();
  assert.equal(calls, 1, "Only one evaluation is made");
  computed.get();
  assert.equal(
    calls,
    1,
    "Only one evaluation is made, even after repeat get() call",
  );

  change();

  computed.get();
  assert.equal(calls, 2, "After a change, a second evaluation is made");
  computed.get();
  assert.equal(
    calls,
    2,
    "No additional evaluation is made after repeat get() call",
  );
}

export function waitFor(fn: () => unknown) {
  let waiter = new Promise((resolve) => {
    let interval = setInterval(() => {
      let result = fn();
      if (result) {
        (async () => {
          await result;
          clearInterval(interval);
          resolve(result);
        })();
      }
    }, 5);
  });

  let timeout = new Promise((resolve) => setTimeout(resolve, 1000));

  return Promise.race([waiter, timeout]);
}

interface Deferred {
  resolve: (value?: unknown) => void;
  reject: (value?: unknown) => void;
  promise: Promise<unknown>;
}

export function defer(): Deferred {
  const deferred = {} as Partial<Deferred>;

  deferred.promise = new Promise((resolve, reject) => {
    deferred.resolve = resolve;
    deferred.reject = reject;
  });

  return deferred as Deferred;
}

export function reactivityTest(
  name: string,
  State: new () => { value: unknown; update: () => void },
) {
  return test(name, () => {
    let state = new State();

    assertReactivelySettled({
      access: () => state.value,
      change: () => state.update(),
    });
  });
}
