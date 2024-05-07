import { describe, test, assert } from "vitest";
import { Signal } from "signal-polyfill";
import { reaction } from "../../src/subtle/reaction.ts";

describe("reaction()", () => {
  test("calls the effect function when the data function return value changes", async () => {
    const count = new Signal.State(0);

    let callCount = 0;
    let value, previousValue;

    reaction(
      () => count.get(),
      (_value, _previousValue) => {
        callCount++;
        value = _value;
        previousValue = _previousValue;
      },
    );

    // Effect callbacks are not called immediately
    assert.strictEqual(callCount, 0);

    await 0;

    // Effect callbacks are not called until the data function changes
    assert.strictEqual(callCount, 0);

    // Effect callbacks are called when the data function changes
    count.set(count.get() + 1);
    await 0;
    assert.strictEqual(callCount, 1);
    assert.strictEqual(value, 1);
    assert.strictEqual(previousValue, 0);

    // is good enough to not freeze / OOM
    for (let i = 0; i < 25; i++) {
      count.set(count.get() + 1);
      await 0;
      assert.strictEqual(callCount, 2 + i);
      assert.strictEqual(value, i + 2);
      assert.strictEqual(previousValue, i + 1);
    }
  });

  test("Unsubscribed reactions aren't called", async () => {
    const count = new Signal.State(0);

    let callCount = 0;
    const unsubscribe = reaction(
      () => count.get(),
      () => {
        callCount++;
      },
    );

    // Check reaction is live
    count.set(count.get() + 1);
    await 0;
    assert.strictEqual(callCount, 1);

    unsubscribe();

    // Check reaction is not live
    count.set(count.get() + 1);
    await 0;
    assert.strictEqual(callCount, 1);
  });

  test("You can unsubscribe while an effect is pending", async () => {
    const count = new Signal.State(0);

    let callCount = 0;
    const unsubscribe = reaction(
      () => count.get(),
      () => {
        callCount++;
      },
    );

    // Check reaction is live
    count.set(count.get() + 1);
    await 0;
    assert.strictEqual(callCount, 1);

    // Check reaction is not live
    count.set(count.get() + 1);
    unsubscribe();
    await 0;
    assert.strictEqual(callCount, 1);
  });

  test("equal data values don't trigger effect", async () => {
    const a = new Signal.State(0);
    const b = new Signal.State(0);

    let callCount = 0;

    reaction(
      () => a.get() + b.get(),
      (_value, _previousValue) => {
        callCount++;
      },
    );

    // 1 + -1 still equals 0
    a.set(1);
    b.set(-1);
    await 0;
    assert.strictEqual(callCount, 0);
  });

  test("throwing in effect doesn't hang reaction", async () => {
    const x = new Signal.State(0);

    let callCount = 0;
    let value, previousValue;
    let thrown = false;

    if (typeof process !== "undefined") {
      process.on("uncaughtException", (error) => {
        console.log("uncaughtException", error);
      });
    }

    reaction(
      () => x.get(),
      (_value, _previousValue) => {
        callCount++;
        value = _value;
        previousValue = _previousValue;
        if (value === 1) {
          thrown = true;
          throw new Error("Oops");
        }
        thrown = false;
      },
    );

    x.set(1);
    await 0;
    assert.strictEqual(callCount, 1);
    assert.strictEqual(thrown, true);

    x.set(2);
    await 0;
    assert.strictEqual(callCount, 2);
    assert.strictEqual(thrown, false);
    assert.strictEqual(value, 2);
    assert.strictEqual(previousValue, 1);
  });
});
