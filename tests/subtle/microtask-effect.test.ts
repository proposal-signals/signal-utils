import { describe, test, assert, expect } from "vitest";
import { Signal } from "signal-polyfill";
import { effect } from "../../src/subtle/microtask-effect.ts";
import { waitForMicrotask } from "../helpers.ts";

describe("effect (via queueMicrotask)", () => {
  test("it works", async () => {
    let count = new Signal.State(0);

    let callCount = 0;

    effect(() => {
      count.get();
      callCount++;
    });

    assert.strictEqual(callCount, 1);

    count.set(count.get() + 1);
    await waitForMicrotask();
    assert.strictEqual(callCount, 2);

    // is good enough to not freeze / OOM
    for (let i = 0; i < 25; i++) {
      count.set(count.get() + 1);
      await waitForMicrotask();
      assert.strictEqual(callCount, 3 + i);
    }
  });

  test("it allows unsubscribe", async () => {
    // Arrange
    let state = new Signal.State(0);
    let actualEffectedState = -1;
    const unsubscribe = effect(() => {
      actualEffectedState = state.get();
    });
    state.set(42);
    await waitForMicrotask();

    // Act
    unsubscribe();
    state.set(0);
    await waitForMicrotask();

    // Assert
    assert.equal(actualEffectedState, 42);
  });
});
