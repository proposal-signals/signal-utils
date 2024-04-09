import { SignalWeakMap } from "../src/weak-map.ts";
import { describe, test, assert } from "vitest";

import { reactivityTest } from "./helpers.ts";

describe("SignalWeakMap", function () {
  test("constructor", () => {
    const obj = {};
    const map = new SignalWeakMap([[obj, 123]]);

    assert.equal(map.get(obj), 123);
    assert.ok(map instanceof WeakMap);
  });

  test("does not work with built-ins", () => {
    const map = new SignalWeakMap();

    assert.throws(
      // @ts-expect-error -- point is testing constructor error
      () => map.set("aoeu", 123),
      TypeError,
    );
    assert.throws(
      // @ts-expect-error -- point is testing constructor error
      () => map.set(true, 123),
      TypeError,
    );
    assert.throws(
      // @ts-expect-error -- point is testing constructor error
      () => map.set(123, 123),
      TypeError,
    );
    assert.throws(
      // @ts-expect-error -- point is testing constructor error
      () => map.set(undefined, 123),
      TypeError,
    );
  });

  test("get/set", () => {
    const obj = {};
    const map = new SignalWeakMap();

    map.set(obj, 123);
    assert.equal(map.get(obj), 123);

    map.set(obj, 456);
    assert.equal(map.get(obj), 456);
  });

  test("has", () => {
    const obj = {};
    const map = new SignalWeakMap();

    assert.equal(map.has(obj), false);
    map.set(obj, 123);
    assert.equal(map.has(obj), true);
  });

  test("delete", () => {
    const obj = {};
    const map = new SignalWeakMap();

    assert.equal(map.has(obj), false);

    map.set(obj, 123);
    assert.equal(map.has(obj), true);

    map.delete(obj);
    assert.equal(map.has(obj), false);
  });

  reactivityTest(
    "get/set",
    class {
      obj = {};
      map = new SignalWeakMap();

      get value() {
        return this.map.get(this.obj);
      }

      update() {
        this.map.set(this.obj, 123);
      }
    },
  );

  reactivityTest(
    "get/set existing value",
    class {
      obj = {};
      map = new SignalWeakMap([[this.obj, 456]]);

      get value() {
        return this.map.get(this.obj);
      }

      update() {
        this.map.set(this.obj, 123);
      }
    },
  );

  reactivityTest(
    "get/set unrelated value",
    class {
      obj = {};
      obj2 = {};
      map = new SignalWeakMap([[this.obj, 456]]);

      get value() {
        return this.map.get(this.obj);
      }

      update() {
        this.map.set(this.obj2, 123);
      }
    },
    false,
  );

  reactivityTest(
    "has",
    class {
      obj = {};
      map = new SignalWeakMap();

      get value() {
        return this.map.has(this.obj);
      }

      update() {
        this.map.set(this.obj, 123);
      }
    },
  );

  reactivityTest(
    "delete",
    class {
      obj = {};
      map = new SignalWeakMap([[this.obj, 123]]);

      get value() {
        return this.map.get(this.obj);
      }

      update() {
        this.map.delete(this.obj);
      }
    },
  );

  reactivityTest(
    "delete unrelated value",
    class {
      obj = {};
      obj2 = {};
      map = new SignalWeakMap([
        [this.obj, 123],
        [this.obj2, 456],
      ]);

      get value() {
        return this.map.get(this.obj);
      }

      update() {
        this.map.delete(this.obj2);
      }
    },
    false,
  );
});
