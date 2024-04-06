import { describe, test, assert } from "vitest";
import { SignalWeakSet } from "../src/weak-set.ts";

import { reactivityTest } from "./helpers.ts";

describe("SignalWeakSet", function () {
  test("constructor", () => {
    const obj = {};
    const set = new SignalWeakSet([obj]);

    assert.equal(set.has(obj), true);
    assert.ok(set instanceof WeakSet);

    const array = [1, 2, 3];
    const iterable = [array];
    const fromIterable = new SignalWeakSet(iterable);
    assert.equal(fromIterable.has(array), true);
  });

  test("does not work with built-ins", () => {
    const set = new SignalWeakSet();

    // @ts-expect-error -- point is testing constructor error
    assert.throws(() => set.add("aoeu"), /Invalid value used in weak set/);
    // @ts-expect-error -- point is testing constructor error
    assert.throws(() => set.add(true), /Invalid value used in weak set/);
    // @ts-expect-error -- point is testing constructor error
    assert.throws(() => set.add(123), /Invalid value used in weak set/);
    // @ts-expect-error -- point is testing constructor error
    assert.throws(() => set.add(undefined), /Invalid value used in weak set/);
  });

  test("add/has", () => {
    const obj = {};
    const set = new SignalWeakSet();

    set.add(obj);
    assert.equal(set.has(obj), true);
  });

  test("delete", () => {
    const obj = {};
    const set = new SignalWeakSet();

    assert.equal(set.has(obj), false);

    set.add(obj);
    assert.equal(set.has(obj), true);

    set.delete(obj);
    assert.equal(set.has(obj), false);
  });

  reactivityTest(
    "add/has",
    class {
      obj = {};
      set = new SignalWeakSet();

      get value() {
        return this.set.has(this.obj);
      }

      update() {
        this.set.add(this.obj);
      }
    },
  );

  reactivityTest(
    "add/has existing value",
    class {
      obj = {};
      obj2 = {};
      set = new SignalWeakSet([this.obj]);

      get value() {
        return this.set.has(this.obj);
      }

      update() {
        this.set.add(this.obj);
      }
    },
  );

  reactivityTest(
    "add/has unrelated value",
    class {
      obj = {};
      obj2 = {};
      set = new SignalWeakSet();

      get value() {
        return this.set.has(this.obj);
      }

      update() {
        this.set.add(this.obj2);
      }
    },
    false,
  );

  reactivityTest(
    "delete",
    class {
      obj = {};
      obj2 = {};
      set = new SignalWeakSet([this.obj, this.obj2]);

      get value() {
        return this.set.has(this.obj);
      }

      update() {
        this.set.delete(this.obj);
      }
    },
  );

  reactivityTest(
    "delete unrelated value",
    class {
      obj = {};
      obj2 = {};
      set = new SignalWeakSet([this.obj, this.obj2]);

      get value() {
        return this.set.has(this.obj);
      }

      update() {
        this.set.delete(this.obj2);
      }
    },
    false,
  );
});
