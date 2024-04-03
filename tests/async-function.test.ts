import { describe, test, assert } from "vitest";
import { assertStable, waitFor } from "./helpers.ts";
import { Signal } from "signal-polyfill";
import { State, signalFunction } from "../src/async-function.ts";

describe("signalFunction", () => {
  describe("State", () => {
    test("initial state", async function () {
      let m = "<invalid state>";
      let resolve: (value?: unknown) => void;

      const promise = new Promise((r) => {
        resolve = r;
      });

      const state = new State(() => promise);
      const promise2 = state.retry();

      m = "isResolved";
      assert.strictEqual(state.isResolved, false, m);

      m = "isRejected";
      assert.strictEqual(state.isRejected, false, m);

      m = "error";
      assert.strictEqual(state.error, null, m);

      m = "value";
      assert.strictEqual(state.value, null, m);

      m = "isPending";
      assert.strictEqual(state.isPending, true, m);

      // @ts-ignore This is normal promise usage
      resolve();
      await promise2;
    });

    test("successful state", async function () {
      let m = "<invalid state>";
      let resolve: (value?: unknown) => void;

      const promise = new Promise((r) => {
        resolve = r;
      });

      const value = Symbol("resolved value");

      const state = new State(() => promise);
      const promise2 = state.retry();

      // @ts-ignore This is normal promise usage
      resolve(value);
      await promise2;

      m = "isResolved";
      assert.strictEqual(state.isResolved, true, m);

      m = "isRejected";
      assert.strictEqual(state.isRejected, false, m);

      m = "error";
      assert.strictEqual(state.error, null, m);

      m = "value";
      assert.strictEqual(state.value, value, m);

      m = "isPending";
      assert.strictEqual(state.isPending, false, m);
    });

    test("error state", async function () {
      let m = "<invalid state>";
      let reject: (value?: unknown) => void;
      const error = new Error("Denied!");

      const promise = new Promise((_r, r) => {
        reject = r;
      });

      const state = new State(() => promise);
      const promise2 = state.retry();

      // @ts-ignore This is normal promise usage
      reject(error);

      // Avoid a test failure on uncaught promise
      try {
        await promise2;
      } catch (e) {
        if (e !== error) throw e;
      }

      m = "isResolved";
      assert.strictEqual(state.isResolved, false, m);

      m = "isRejected";
      assert.strictEqual(state.isRejected, true, m);

      m = "error";
      assert.strictEqual(state.error, error, m);

      m = "value";
      assert.strictEqual(state.value, null, m);

      m = "isPending";
      assert.strictEqual(state.isPending, false, m);
    });
  });

  test("lifecycle", async function () {
    let runCount = 0;
    let steps: string[] = [];

    const countSignal = new Signal.State(1);
    const asyncState = signalFunction(async () => {
      let count = countSignal.get();

      runCount++;
      // Pretend we're doing async work
      await Promise.resolve();

      steps.push(`run ${runCount}, value: ${count}`);
    });

    assert.strictEqual(asyncState.value, null);
    assertStable(() => asyncState.value);

    await waitFor(() => asyncState.promise);
    assertStable(() => asyncState.value);

    countSignal.set(2);
    await waitFor(() => asyncState.promise);
    assertStable(() => asyncState.value);

    countSignal.set(6);
    await waitFor(() => asyncState.promise);
    assertStable(() => asyncState.value);

    assert.deepEqual(steps, [
      "run 1, value: 1",
      "run 2, value: 2",
      "run 3, value: 6",
    ]);
  });

  test("it works with sync functions", async function () {
    const countSignal = new Signal.State(1);
    const asyncState = signalFunction(() => {
      let count = countSignal.get();

      return count * 2;
    });

    assert.strictEqual(asyncState.value, null);
    await asyncState.promise;

    assert.strictEqual(asyncState.value, 2);
    assertStable(() => asyncState.value);

    countSignal.set(2);
    await waitFor(() => asyncState.promise);

    assert.strictEqual(asyncState.value, 4);
    assertStable(() => asyncState.value);

    countSignal.set(6);
    await waitFor(() => asyncState.promise);

    assert.strictEqual(asyncState.value, 12);
    assertStable(() => asyncState.value);

    countSignal.set(7);
    await waitFor(() => asyncState.promise);

    assert.strictEqual(asyncState.value, 14);
    assertStable(() => asyncState.value);
  });

  test("it works with async functions", async function () {
    let runCount = 0;
    const countSignal = new Signal.State(1);
    const asyncState = signalFunction(async () => {
      runCount++;
      let count = countSignal.get();
      // Pretend we're doing async work
      await Promise.resolve();

      return count * 2;
    });

    assert.strictEqual(runCount, 0);
    assert.strictEqual(asyncState.value, null);
    assertStable(() => asyncState.value);
    assert.strictEqual(runCount, 1);

    assert.isTrue(asyncState.isLoading);
    await waitFor(() => asyncState.promise);
    assert.isFalse(asyncState.isLoading);

    assert.strictEqual(asyncState.value, 2);
    assertStable(() => asyncState.value);
    assert.strictEqual(runCount, 1);

    countSignal.set(2);
    await waitFor(() => asyncState.promise);
    assert.strictEqual(asyncState.value, 4);
    assertStable(() => asyncState.value);
    assert.strictEqual(runCount, 2);

    countSignal.set(6);
    await waitFor(() => asyncState.promise);

    assert.strictEqual(asyncState.value, 12);
    assertStable(() => asyncState.value);
    assert.strictEqual(runCount, 3);
  });
});
