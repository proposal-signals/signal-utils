import { describe, test, assert } from "vitest";
import { Signal } from "signal-polyfill";
import { batchedEffect, batch } from "../../src/subtle/batched-effect.ts";

describe("batchedEffect()", () => {
  test("calls the effect function synchronously at the end of a batch", async () => {
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

  test("nested batches", async () => {
    const a = new Signal.State(0);
    const b = new Signal.State(0);
    const c = new Signal.State(0);

    let callCount = 0;

    batchedEffect(() => {
      a.get();
      b.get();
      c.get();
      callCount++;
    });

    batch(() => {
      a.set(1);
      batch(() => {
        b.set(1);
      });
      c.set(1);
    });

    // Effect callbacks are batched and called sync
    assert.strictEqual(callCount, 2);
  });

  test("batch nested in an effect", async () => {
    const a = new Signal.State(0);
    const b = new Signal.State(0);

    let log: Array<string> = [];

    batchedEffect(() => {
      log.push("A");
      a.get();
      batch(() => {
        b.set(a.get());
      });
    });

    assert.deepEqual(log, ["A"]);

    batchedEffect(() => {
      log.push("B");
      b.get();
    });

    assert.deepEqual(log, ["A", "B"]);
    log.length = 0;

    batch(() => {
      a.set(1);
    });

    // Both effects should run
    assert.deepEqual(log, ["A", "B"]);
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

  test("exceptions in batches", () => {
    const a = new Signal.State(0);

    let callCount = 0;
    let errorCount = 0;

    batchedEffect(() => {
      a.get();
      callCount++;
    });

    try {
      batch(() => {
        a.set(1);
        throw new Error("oops");
      });
    } catch (e) {
      // Pass
      errorCount++;
    }

    // batch() propagates exceptions
    assert.strictEqual(errorCount, 1);

    // Effect callbacks still called if their dependencies were updated
    // before the exception
    assert.strictEqual(callCount, 2);

    // New batches still work

    batch(() => {
      a.set(2);
    });

    assert.strictEqual(callCount, 3);
  });

  test("exceptions in effects", async () => {
    const a = new Signal.State(0);

    let callCount1 = 0;
    let callCount2 = 0;
    let errorCount = 0;

    try {
      batchedEffect(() => {
        a.get();
        callCount1++;
        throw new Error("oops");
      });
    } catch (e) {
      // Pass
      errorCount++;
    }

    // Effects are called immediately, so the exception is thrown immediately
    assert.strictEqual(errorCount, 1);

    // A second effect, to test that it still runs
    batchedEffect(() => {
      a.get();
      callCount2++;
    });

    try {
      batch(() => {
        a.set(1);
      });
    } catch (e) {
      // Pass
      errorCount++;
    }

    // batch() propagates exceptions
    assert.strictEqual(errorCount, 2);
    assert.strictEqual(callCount1, 2);
    // Later effects are still called
    assert.strictEqual(callCount2, 2);
  });
});
