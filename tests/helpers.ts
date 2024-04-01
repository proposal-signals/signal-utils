import { assert } from "vitest";
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
