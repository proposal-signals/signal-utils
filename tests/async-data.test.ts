import { describe, test, assert } from "vitest";
import { defer } from "./helpers.ts";
import { load, SignalAsyncData } from "../src/async-data.ts";

describe("Unit | load", function () {
  test("given a promise", async function () {
    const { promise, resolve } = defer();
    const result = load(promise);
    assert.ok(
      result instanceof SignalAsyncData,
      "it returns a TrackedAsyncData instance",
    );
    resolve();
    await promise;
  });

  test("given a plain value", async function () {
    const result = load(12);
    assert.ok(
      result instanceof SignalAsyncData,
      "it returns a TrackedAsyncData instance",
    );
  });
});

describe("Unit | TrackedAsyncData", function () {
  test("cannot be subclassed", function () {
    // @ts-expect-error: The type is not statically subclassable, either, so
    //   this fails both at the type-checking level and dynamically at runtime.
    class Subclass extends SignalAsyncData<unknown> {}

    assert.throws(() => new Subclass(Promise.resolve("nope")));
  });

  test("is initially PENDING", async function () {
    const deferred = defer();

    const result = new SignalAsyncData(deferred.promise);
    assert.strictEqual(result.state, "PENDING");
    assert.strictEqual(result.isPending, true);
    assert.strictEqual(result.isResolved, false);
    assert.strictEqual(result.isRejected, false);
    assert.strictEqual(result.value, null);
    assert.strictEqual(result.error, null);

    deferred.resolve();
    await deferred.promise;
  });

  test("it updates to resolved state", async function () {
    const deferred = defer();
    const result = new SignalAsyncData(deferred.promise);

    deferred.resolve("foobar");
    await deferred.promise;

    assert.strictEqual(result.state, "RESOLVED");
    assert.strictEqual(result.isPending, false);
    assert.strictEqual(result.isResolved, true);
    assert.strictEqual(result.isRejected, false);
    assert.strictEqual(result.value, "foobar");
    assert.strictEqual(result.error, null);
  });

  describe("it returns resolved state for non-thenable input", function () {
    test("undefined", async function () {
      const loadUndefined = new SignalAsyncData(undefined);
      await loadUndefined;

      assert.strictEqual(loadUndefined.state, "RESOLVED");
      assert.strictEqual(loadUndefined.isPending, false);
      assert.strictEqual(loadUndefined.isResolved, true);
      assert.strictEqual(loadUndefined.isRejected, false);
      assert.strictEqual(loadUndefined.value, undefined);
      assert.strictEqual(loadUndefined.error, null);
    });

    test("null", async function () {
      const loadNull = new SignalAsyncData(null);
      await loadNull;

      assert.strictEqual(loadNull.state, "RESOLVED");
      assert.strictEqual(loadNull.isPending, false);
      assert.strictEqual(loadNull.isResolved, true);
      assert.strictEqual(loadNull.isRejected, false);
      assert.strictEqual(loadNull.value, null);
      assert.strictEqual(loadNull.error, null);
    });

    test("non-thenable object", async function () {
      const notAThenableObject = { notAThenable: true };
      const loadObject = new SignalAsyncData(notAThenableObject);
      await loadObject;

      assert.strictEqual(loadObject.state, "RESOLVED");
      assert.strictEqual(loadObject.isPending, false);
      assert.strictEqual(loadObject.isResolved, true);
      assert.strictEqual(loadObject.isRejected, false);
      assert.strictEqual(loadObject.value, notAThenableObject);
      assert.strictEqual(loadObject.error, null);
    });

    test("boolean: true", async function () {
      const loadTrue = new SignalAsyncData(true);
      await loadTrue;

      assert.strictEqual(loadTrue.state, "RESOLVED");
      assert.strictEqual(loadTrue.isPending, false);
      assert.strictEqual(loadTrue.isResolved, true);
      assert.strictEqual(loadTrue.isRejected, false);
      assert.strictEqual(loadTrue.value, true);
      assert.strictEqual(loadTrue.error, null);
    });

    test("boolean: false", async function () {
      const loadFalse = new SignalAsyncData(false);
      await loadFalse;

      assert.strictEqual(loadFalse.state, "RESOLVED");
      assert.strictEqual(loadFalse.isPending, false);
      assert.strictEqual(loadFalse.isResolved, true);
      assert.strictEqual(loadFalse.isRejected, false);
      assert.strictEqual(loadFalse.value, false);
      assert.strictEqual(loadFalse.error, null);
    });

    test("number", async function () {
      const loadNumber = new SignalAsyncData(5);
      await loadNumber;

      assert.strictEqual(loadNumber.state, "RESOLVED");
      assert.strictEqual(loadNumber.isPending, false);
      assert.strictEqual(loadNumber.isResolved, true);
      assert.strictEqual(loadNumber.isRejected, false);
      assert.strictEqual(loadNumber.value, 5);
      assert.strictEqual(loadNumber.error, null);
    });

    test("string", async function () {
      const loadString = new SignalAsyncData("js");
      await loadString;

      // loadString
      assert.strictEqual(loadString.state, "RESOLVED");
      assert.strictEqual(loadString.isPending, false);
      assert.strictEqual(loadString.isResolved, true);
      assert.strictEqual(loadString.isRejected, false);
      assert.strictEqual(loadString.value, "js");
      assert.strictEqual(loadString.error, null);
    });
  });

  test("it returns error state", async function () {
    // This handles the error throw from rendering a rejected promise
    const deferred = defer();
    const result = new SignalAsyncData(deferred.promise);

    // eslint-disable-next-line ember/no-array-prototype-extensions
    deferred.reject(new Error("foobar"));
    await deferred.promise.catch((error) => {
      assert.strictEqual(error instanceof Error, true);
      assert.strictEqual(error.message, "foobar", "thrown promise rejection");
    });

    assert.strictEqual(result.state, "REJECTED");
    assert.strictEqual(result.isPending, false);
    assert.strictEqual(result.isResolved, false);
    assert.strictEqual(result.isRejected, true);
    assert.strictEqual(result.value, null);
    assert.strictEqual((result.error as Error).message, "foobar");
  });

  test("it returns loading state and then loaded state", async function () {
    const deferred = defer();
    const result = new SignalAsyncData(deferred.promise);
    assert.strictEqual(result.state, "PENDING");

    deferred.resolve();
    await deferred.promise;

    assert.strictEqual(result.state, "RESOLVED");
  });

  test("it returns loading state and then error state", async function () {
    const deferred = defer();
    const result = new SignalAsyncData(deferred.promise);
    assert.strictEqual(result.state, "PENDING");

    // eslint-disable-next-line ember/no-array-prototype-extensions
    deferred.reject(new Error("foobar"));
    await deferred.promise.catch((err: Error) => {
      assert.strictEqual(err instanceof Error, true);
      assert.strictEqual(err.message, "foobar");
    });

    assert.strictEqual(result.state, "REJECTED");
  });

  test("it returns loaded state for already-resolved promises", async function () {
    const promise = Promise.resolve("hello");
    const result = new SignalAsyncData(promise);
    await promise;
    assert.strictEqual(result.state, "RESOLVED");
  });

  test("it returns error state for already-rejected promises", async function () {
    const promise = Promise.reject(new Error("foobar"));
    const result = new SignalAsyncData(promise);

    // This handles the error thrown *locally*.
    await promise.catch((error: Error) => {
      assert.strictEqual(error instanceof Error, true);
      assert.strictEqual(error.message, "foobar");
    });

    assert.strictEqual(result.state, "REJECTED");
  });
});
