import { describe, test, assert } from "vitest";
import { Signal } from "signal-polyfill";
import { batchedEffect, batch } from "../../src/subtle/batched-effect.ts";

describe("batchedEffect()", () => {
  test("calls the effect function synchronously inside a batch", async () => {
    const a = new Signal.State(0);
    const b = new Signal.State(0);

    let callCount = 0;

    batchedEffect(() => {
      a.get();
      b.get();
      callCount++;
    });

    // Effect callbacks are called immediately
    assert.strictEqual(callCount, 1);

    batch(() => {
      a.set(1);
      b.set(1);
    });

    // Effect callbacks are batched and called sync
    assert.strictEqual(callCount, 2);

    batch(() => {
      a.set(2);
    });
    assert.strictEqual(callCount, 3);

    await 0;

    // No lingering effect calls
    assert.strictEqual(callCount, 3);
  });

  test("calls the effect function asynchronously outside a batch", async () => {
    const a = new Signal.State(0);
    const b = new Signal.State(0);

    let callCount = 0;

    batchedEffect(() => {
      a.get();
      b.get();
      callCount++;
    });

    a.set(1);
    b.set(1);

    // Non-batched changes are not called sync
    assert.strictEqual(callCount, 1);

    await 0;

    // Non-batched changes are called async
    assert.strictEqual(callCount, 2);
  });

  test("handles mixed batched and unbatched changes", async () => {
    const a = new Signal.State(0);
    const b = new Signal.State(0);

    let callCount = 0;

    batchedEffect(() => {
      a.get();
      b.get();
      callCount++;
    });

    // Effect callbacks are called immediately
    assert.strictEqual(callCount, 1);

    a.set(1);

    batch(() => {
      b.set(1);
    });

    // Effect callbacks are batched and called sync
    assert.strictEqual(callCount, 2);

    batch(() => {
      a.set(2);
    });
    assert.strictEqual(callCount, 3);

    await 0;

    // No lingering effect calls
    assert.strictEqual(callCount, 3);
  });
});
