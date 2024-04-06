import { SignalMap } from "../src/map.ts";
import { describe, test, assert } from "vitest";
import { expectTypeOf } from "expect-type";

import { reactivityTest } from "./helpers.ts";

expectTypeOf<SignalMap<string, number>>().toMatchTypeOf<Map<string, number>>();
expectTypeOf<Map<string, number>>().not.toMatchTypeOf<
  SignalMap<string, number>
>();

describe("SignalMap", function () {
  test("constructor", () => {
    const map = new SignalMap([["foo", 123]]);

    assert.equal(map.get("foo"), 123);
    assert.equal(map.size, 1);
    assert.ok(map instanceof Map);
  });

  test("works with all kinds of keys", () => {
    const map = new SignalMap<unknown, unknown>([
      ["foo", 123],
      [{}, {}],
      [
        () => {
          /* no op! */
        },
        "bar",
      ],
      [123, true],
      [true, false],
      [null, null],
    ]);

    assert.equal(map.size, 6);
  });

  test("get/set", () => {
    const map = new SignalMap();

    map.set("foo", 123);
    assert.equal(map.get("foo"), 123);

    map.set("foo", 456);
    assert.equal(map.get("foo"), 456);
  });

  test("has", () => {
    const map = new SignalMap();

    assert.equal(map.has("foo"), false);
    map.set("foo", 123);
    assert.equal(map.has("foo"), true);
  });

  test("entries", () => {
    const map = new SignalMap();
    map.set(0, 1);
    map.set(1, 2);
    map.set(2, 3);

    const iter = map.entries();

    assert.deepEqual(iter.next().value, [0, 1]);
    assert.deepEqual(iter.next().value, [1, 2]);
    assert.deepEqual(iter.next().value, [2, 3]);
    assert.equal(iter.next().done, true);
  });

  test("keys", () => {
    const map = new SignalMap();
    map.set(0, 1);
    map.set(1, 2);
    map.set(2, 3);

    const iter = map.keys();

    assert.equal(iter.next().value, 0);
    assert.equal(iter.next().value, 1);
    assert.equal(iter.next().value, 2);
    assert.equal(iter.next().done, true);
  });

  test("values", () => {
    const map = new SignalMap();
    map.set(0, 1);
    map.set(1, 2);
    map.set(2, 3);

    const iter = map.values();

    assert.equal(iter.next().value, 1);
    assert.equal(iter.next().value, 2);
    assert.equal(iter.next().value, 3);
    assert.equal(iter.next().done, true);
  });

  test("forEach", () => {
    const map = new SignalMap();
    map.set(0, 1);
    map.set(1, 2);
    map.set(2, 3);

    let count = 0;
    let values = "";

    map.forEach((v, k) => {
      count++;
      values += k;
      values += v;
    });

    assert.equal(count, 3);
    assert.equal(values, "011223");
  });

  test("size", () => {
    const map = new SignalMap();
    assert.equal(map.size, 0);

    map.set(0, 1);
    assert.equal(map.size, 1);

    map.set(1, 2);
    assert.equal(map.size, 2);

    map.delete(1);
    assert.equal(map.size, 1);

    map.set(0, 3);
    assert.equal(map.size, 1);
  });

  test("delete", () => {
    const map = new SignalMap();

    assert.equal(map.has(0), false);

    map.set(0, 123);
    assert.equal(map.has(0), true);

    map.delete(0);
    assert.equal(map.has(0), false);
  });

  test("clear", () => {
    const map = new SignalMap();

    map.set(0, 1);
    map.set(1, 2);
    assert.equal(map.size, 2);

    map.clear();
    assert.equal(map.size, 0);
    assert.equal(map.get(0), undefined);
    assert.equal(map.get(1), undefined);
  });

  reactivityTest(
    "get/set",
    class {
      map = new SignalMap();

      get value() {
        return this.map.get("foo");
      }

      update() {
        this.map.set("foo", 123);
      }
    },
  );

  reactivityTest(
    "get/set existing value",
    class {
      map = new SignalMap([["foo", 456]]);

      get value() {
        return this.map.get("foo");
      }

      update() {
        this.map.set("foo", 123);
      }
    },
  );

  reactivityTest(
    "get/set unrelated value",
    class {
      map = new SignalMap([["foo", 456]]);

      get value() {
        return this.map.get("foo");
      }

      update() {
        this.map.set("bar", 123);
      }
    },
    false,
  );

  reactivityTest(
    "has",
    class {
      map = new SignalMap();

      get value() {
        return this.map.has("foo");
      }

      update() {
        this.map.set("foo", 123);
      }
    },
  );

  reactivityTest(
    "entries",
    class {
      map = new SignalMap();

      get value() {
        return this.map.entries();
      }

      update() {
        this.map.set("foo", 123);
      }
    },
  );

  reactivityTest(
    "keys",
    class {
      map = new SignalMap();

      get value() {
        return this.map.keys();
      }

      update() {
        this.map.set("foo", 123);
      }
    },
  );

  reactivityTest(
    "values",
    class {
      map = new SignalMap();

      get value() {
        return this.map.values();
      }

      update() {
        this.map.set("foo", 123);
      }
    },
  );

  reactivityTest(
    "forEach",
    class {
      map = new SignalMap();

      get value() {
        this.map.forEach(() => {
          /* no op! */
        });
        return "test";
      }

      update() {
        this.map.set("foo", 123);
      }
    },
  );

  reactivityTest(
    "size",
    class {
      map = new SignalMap();

      get value() {
        return this.map.size;
      }

      update() {
        this.map.set("foo", 123);
      }
    },
  );

  reactivityTest(
    "delete",
    class {
      map = new SignalMap([["foo", 123]]);

      get value() {
        return this.map.get("foo");
      }

      update() {
        this.map.delete("foo");
      }
    },
  );

  reactivityTest(
    "delete unrelated value",
    class {
      map = new SignalMap([
        ["foo", 123],
        ["bar", 456],
      ]);

      get value() {
        return this.map.get("foo");
      }

      update() {
        this.map.delete("bar");
      }
    },
    false,
  );

  reactivityTest(
    "clear",
    class {
      map = new SignalMap([["foo", 123]]);

      get value() {
        return this.map.get("foo");
      }

      update() {
        this.map.clear();
      }
    },
  );
});
