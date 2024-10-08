import { describe, test, assert } from "vitest";
import { Signal } from "signal-polyfill";
import { AsyncComputed } from "../src/async-computed.ts";

describe("AsyncComputed", () => {
  test("initialValue", async () => {
    const task = new AsyncComputed(async () => 1, { initialValue: 0 });
    assert.strictEqual(task.value, 0);
  });

  test("AsyncComputed runs", async () => {
    const task = new AsyncComputed(async () => {
      // Make the task take more than one microtask
      await 0;
      return 1;
    });
    assert.equal(task.status, "initial");

    // Getting the value starts the task
    assert.strictEqual(task.value, undefined);
    assert.strictEqual(task.error, undefined);
    assert.equal(task.status, "pending");

    const result = await task.complete;

    assert.equal(task.status, "complete");
    assert.strictEqual(task.value, 1);
    assert.strictEqual(result, 1);
    assert.strictEqual(task.error, undefined);
  });

  test("AsyncComputed re-runs when signal dependencies change", async () => {
    const dep = new Signal.State("a");
    const task = new AsyncComputed(async () => {
      // Read dependencies before first await
      const value = dep.get();
      return value;
    });

    await task.complete;
    assert.equal(task.status, "complete");
    assert.strictEqual(task.value, "a");
    assert.strictEqual(task.error, undefined);

    dep.set("b");
    assert.equal(task.status, "pending");

    await task.complete;
    assert.equal(task.status, "complete");
    assert.strictEqual(task.value, "b");
    assert.strictEqual(task.error, undefined);

    dep.set("c");
    assert.equal(task.status, "pending");
  });

  test("Preemptive runs reuse the same completed promise", async () => {
    const dep = new Signal.State("a");
    const deferredOne = Promise.withResolvers<void>();
    let deferred = deferredOne;
    const abortSignals: Array<AbortSignal> = [];
    const task = new AsyncComputed(async (abortSignal) => {
      // Read dependencies before first await
      const value = dep.get();

      abortSignals.push(abortSignal);
      // Wait until we're told to go. The first run will wait so that the
      // second run can preempt it.
      await deferred.promise;
      return value;
    });

    // Capture the promise that the task will complete
    const firstRunComplete = task.complete;

    // Trigger a new run with a new deferred
    const deferredTwo = Promise.withResolvers<void>();
    deferred = deferredTwo;
    dep.set("b");
    const secondRunComplete = task.complete;

    assert.equal(task.status, "pending");
    assert.strictEqual(abortSignals.length, 2);
    assert.strictEqual(abortSignals[0]!.aborted, true);
    assert.strictEqual(abortSignals[1]!.aborted, false);

    // We should not have created a new Promise. The first Promise should be
    // resolved with the result of the second run.
    assert.strictEqual(firstRunComplete, secondRunComplete);

    // Resolve the second run
    deferredTwo.resolve();
    const result = await task.complete;
    assert.equal(result, "b");
  });

  test("AsyncComputed errors and can re-run", async () => {
    const dep = new Signal.State("a");
    const task = new AsyncComputed(async () => {
      // Read dependencies before first await
      const value = dep.get();
      await 0;
      if (value === "a") {
        throw new Error("a");
      }
      return value;
    });

    task.run();
    assert.equal(task.status, "pending");

    try {
      await task.complete;
      assert.fail("Task should have thrown");
    } catch (error) {
      assert.equal(task.status, "error");
      assert.strictEqual(task.value, undefined);
      assert.strictEqual(task.error, error);
    }

    // Check that the task can re-run after an error

    dep.set("b");
    assert.equal(task.status, "pending");
    await task.complete;
    assert.strictEqual(task.value, "b");
    assert.strictEqual(task.error, undefined);
  });

  test("get() throws on error", async () => {
    const task = new AsyncComputed(async () => {
      throw new Error("A");
    });
    task.run();
    await task.complete.catch(() => {});
    assert.throws(() => task.get());
  });

  test("can chain a computed signal", async () => {
    const dep = new Signal.State("a");
    const task = new AsyncComputed(async () => {
      // Read dependencies before first await
      const value = dep.get();
      await 0;
      if (value === "b") {
        throw new Error("b");
      }
      return value;
    });
    const computed = new Signal.Computed(() => task.get());
    assert.strictEqual(computed.get(), undefined);

    await task.complete;
    assert.strictEqual(computed.get(), "a");

    dep.set("b");
    await task.complete.catch(() => {});
    assert.throws(() => computed.get());

    dep.set("c");
    await task.complete;
    assert.strictEqual(computed.get(), "c");
  });

  test("can chain an AsyncComputed", async () => {
    const dep = new Signal.State("a");
    const task1 = new AsyncComputed(async () => {
      // Read dependencies before first await
      const value = dep.get();
      await 0;
      if (value === "b") {
        throw new Error("b");
      }
      return value;
    });
    const task2 = new AsyncComputed(async () => {
      return task1.complete;
    });

    assert.strictEqual(task2.get(), undefined);
    assert.strictEqual(task2.status, "pending");

    await task2.complete;
    assert.strictEqual(task2.get(), "a");
    assert.strictEqual(task2.status, "complete");

    dep.set("b");
    assert.strictEqual(task2.status, "pending");
    await task2.complete.catch(() => {});
    assert.throws(() => task2.get());
    assert.strictEqual(task2.status, "error");

    dep.set("c");
    assert.strictEqual(task2.status, "pending");
    await task2.complete;
    assert.strictEqual(task2.get(), "c");
    assert.strictEqual(task2.status, "complete");
  });
});
