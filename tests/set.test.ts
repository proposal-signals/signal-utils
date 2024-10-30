import { describe, test, assert } from "vitest";

import { SignalSet } from "../src/set.ts";

import { expectTypeOf } from "expect-type";

import { reactivityTest } from "./helpers.ts";

expectTypeOf<SignalSet<string>>().toMatchTypeOf<Set<string>>();
expectTypeOf<Set<string>>().not.toEqualTypeOf<SignalSet<string>>();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFn = (...args: any[]) => any;

describe("SignalSet", function() {
  test("constructor", () => {
    const set = new SignalSet(["foo", 123]);

    assert.equal(set.has("foo"), true);
    assert.equal(set.size, 2);
    assert.ok(set instanceof Set);

    const setFromSet = new SignalSet(set);
    assert.equal(setFromSet.has("foo"), true);
    assert.equal(setFromSet.size, 2);
    assert.ok(setFromSet instanceof Set);

    const setFromEmpty = new SignalSet();
    assert.equal(setFromEmpty.has("anything"), false);
    assert.equal(setFromEmpty.size, 0);
    assert.ok(setFromEmpty instanceof Set);
  });

  test("works with all kinds of values", () => {
    const set = new SignalSet<
      string | Record<PropertyKey, unknown> | AnyFn | number | boolean | null
    >([
      "foo",
      {},
      () => {
        /* no op */
      },
      123,
      true,
      null,
    ]);

    assert.equal(set.size, 6);
  });

  test("add/has", () => {
    const set = new SignalSet();

    set.add("foo");
    assert.equal(set.has("foo"), true);
  });

  test("entries", () => {
    const set = new SignalSet();
    set.add(0);
    set.add(2);
    set.add(1);

    const iter = set.entries();

    assert.deepEqual(iter.next().value, [0, 0]);
    assert.deepEqual(iter.next().value, [2, 2]);
    assert.deepEqual(iter.next().value, [1, 1]);
    assert.equal(iter.next().done, true);
  });

  test("keys", () => {
    const set = new SignalSet();
    set.add(0);
    set.add(2);
    set.add(1);

    const iter = set.keys();

    assert.equal(iter.next().value, 0);
    assert.equal(iter.next().value, 2);
    assert.equal(iter.next().value, 1);
    assert.equal(iter.next().done, true);
  });

  test("values", () => {
    const set = new SignalSet();
    set.add(0);
    set.add(2);
    set.add(1);

    const iter = set.values();

    assert.equal(iter.next().value, 0);
    assert.equal(iter.next().value, 2);
    assert.equal(iter.next().value, 1);
    assert.equal(iter.next().done, true);
  });

  test("forEach", () => {
    const set = new SignalSet();
    set.add(0);
    set.add(1);
    set.add(2);

    let count = 0;
    let values = "";

    set.forEach((v, k) => {
      count++;
      values += k;
      values += v;
    });

    assert.equal(count, 3);
    assert.equal(values, "001122");
  });

  test("intersection", () => { });

  if ('difference' in Set) {
    test("difference", () => {
      let odds = new SignalSet([1, 3, 5, 7, 9]);
      let squares = new SignalSet([1, 4, 9]);
      let result = odds.difference(squares);
      let values = result.values();

      assert.deepEqual(values, [3, 5, 7]);
    });
  }

  test("symmetricDifference", () => { });
  test("isDisjointFrom", () => { });
  test("isSubsetOf", () => { });
  test("isSupersetOf", () => { });
  test("union", () => { });

  test("size", () => {
    const set = new SignalSet();
    assert.equal(set.size, 0);

    set.add(0);
    assert.equal(set.size, 1);

    set.add(1);
    assert.equal(set.size, 2);

    set.delete(1);
    assert.equal(set.size, 1);

    set.add(0);
    assert.equal(set.size, 1);
  });

  test("delete", () => {
    const set = new SignalSet();

    assert.equal(set.has(0), false);

    set.add(0);
    assert.equal(set.has(0), true);

    set.delete(0);
    assert.equal(set.has(0), false);
  });

  test("clear", () => {
    const set = new SignalSet();

    set.add(0);
    set.add(1);
    assert.equal(set.size, 2);

    set.clear();
    assert.equal(set.size, 0);
    assert.equal(set.has(0), false);
    assert.equal(set.has(1), false);
  });

  describe('reactivity', () => {
    reactivityTest(
      "add/has",
      class {
        set = new SignalSet();

        get value() {
          return this.set.has("foo");
        }

        update() {
          this.set.add("foo");
        }
      },
    );

    reactivityTest(
      "add/has existing value",
      class {
        set = new SignalSet(["foo"]);

        get value() {
          return this.set.has("foo");
        }

        update() {
          this.set.add("foo");
        }
      },
    );

    reactivityTest(
      "add/has unrelated value",
      class {
        set = new SignalSet();

        get value() {
          return this.set.has("foo");
        }

        update() {
          this.set.add("bar");
        }
      },
      false,
    );

    reactivityTest(
      "entries",
      class {
        set = new SignalSet();

        get value() {
          return this.set.entries();
        }

        update() {
          this.set.add("foo");
        }
      },
    );

    reactivityTest(
      "keys",
      class {
        set = new SignalSet();

        get value() {
          return this.set.keys();
        }

        update() {
          this.set.add("foo");
        }
      },
    );

    reactivityTest(
      "values",
      class {
        set = new SignalSet();

        get value() {
          return this.set.values();
        }

        update() {
          this.set.add("foo");
        }
      },
    );

    reactivityTest(
      "forEach",
      class {
        set = new SignalSet();

        get value() {
          this.set.forEach(() => {
            /* no-op */
          });
          return "test";
        }

        update() {
          this.set.add("foo");
        }
      },
    );

    reactivityTest(
      "size",
      class {
        set = new SignalSet();

        get value() {
          return this.set.size;
        }

        update() {
          this.set.add("foo");
        }
      },
    );

    reactivityTest(
      "delete",
      class {
        set = new SignalSet(["foo", 123]);

        get value() {
          return this.set.has("foo");
        }

        update() {
          this.set.delete("foo");
        }
      },
    );

    reactivityTest(
      "delete unrelated value",
      class {
        set = new SignalSet(["foo", 123]);

        get value() {
          return this.set.has("foo");
        }

        update() {
          this.set.delete(123);
        }
      },
      false,
    );

    reactivityTest(
      "clear",
      class {
        set = new SignalSet(["foo", 123]);

        get value() {
          return this.set.has("foo");
        }

        update() {
          this.set.clear();
        }
      },
    );
  });
});
