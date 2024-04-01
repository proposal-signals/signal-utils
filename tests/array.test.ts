import { describe, it, test, assert } from "vitest";
import { ReactiveArray } from "signal-utils/array";
import { expectTypeOf } from "expect-type";
import { assertReactivelySettled } from "./helpers";

const ARRAY_GETTER_METHODS = [
  "concat",
  "entries",
  "every",
  "filter",
  "find",
  "findIndex",
  "flat",
  "flatMap",
  "forEach",
  "includes",
  "indexOf",
  "join",
  "keys",
  "lastIndexOf",
  "map",
  "reduce",
  "reduceRight",
  "slice",
  "some",
  "values",
];

const ARRAY_SETTER_METHODS = [
  "copyWithin",
  "fill",
  "pop",
  "push",
  "reverse",
  "shift",
  "sort",
  "splice",
  "unshift",
];

// We can use a `ReactiveArray<T>` anywhere we can use an `Array<T>` (but not
// vice versa).
expectTypeOf<ReactiveArray<unknown>>().toMatchTypeOf<Array<unknown>>();

describe("ReactiveArray", function () {
  test("Can get values on array directly", () => {
    let arr = new ReactiveArray(["foo"]);

    assert.equal(arr[0], "foo");
  });

  test("Can get length on array directly", () => {
    let arr = new ReactiveArray(["foo"]);

    assert.equal(arr.length, 1);
  });

  test("Can set values on array directly", () => {
    let arr = new ReactiveArray();
    arr[0] = 123;

    assert.equal(arr[0], 123);
  });

  test("Can set length on array directly", () => {
    let arr = new ReactiveArray();
    arr.length = 123;

    assert.equal(arr.length, 123);
  });

  test("Can clear array by setting length to 0", () => {
    let arr = new ReactiveArray([123]);
    arr.length = 0;

    assert.equal(arr.length, 0);
    assert.equal(arr[0], undefined);
  });

  describe("methods", () => {
    test("isArray", () => {
      let arr = new ReactiveArray();

      assert.ok(Array.isArray(arr));
    });

    test("length", () => {
      let arr = new ReactiveArray();

      assert.equal(arr.length, 0);

      arr[100] = 1;

      assert.equal(arr.length, 101);
    });

    test("concat", () => {
      let arr = new ReactiveArray();
      let arr2 = arr.concat([1], new ReactiveArray([2]));

      assert.deepEqual(arr2, [1, 2]);
      assert.notOk(arr2 instanceof ReactiveArray);
    });

    test("copyWithin", () => {
      let arr = new ReactiveArray([1, 2, 3]);
      arr.copyWithin(1, 0, 1);

      assert.deepEqual(arr, [1, 1, 3]);
    });

    test("entries", () => {
      let arr = new ReactiveArray([1, 2, 3]);
      let iter = arr.entries();

      assert.deepEqual(iter.next().value, [0, 1]);
      assert.deepEqual(iter.next().value, [1, 2]);
      assert.deepEqual(iter.next().value, [2, 3]);
      assert.equal(iter.next().done, true);
    });

    test("every", () => {
      let arr = new ReactiveArray([1, 2, 3]);

      assert.ok(arr.every((v) => typeof v === "number"));
      assert.notOk(arr.every((v) => v !== 2));
    });

    test("fill", () => {
      let arr = new ReactiveArray();
      arr.length = 100;
      arr.fill(123);

      let count = 0;
      let isCorrect = true;

      for (let value of arr) {
        count++;
        isCorrect = isCorrect && value === 123;
      }

      assert.equal(count, 100);
      assert.ok(isCorrect);
    });

    test("filter", () => {
      let arr = new ReactiveArray([1, 2, 3]);
      let arr2 = arr.filter((v) => v > 1);

      assert.deepEqual(arr2, [2, 3]);
      assert.notOk(arr2 instanceof ReactiveArray);
    });

    test("find", () => {
      let arr = new ReactiveArray([1, 2, 3]);

      assert.equal(
        arr.find((v) => v > 1),
        2,
      );
    });

    test("findIndex", () => {
      let arr = new ReactiveArray([1, 2, 3]);

      assert.equal(
        arr.findIndex((v) => v > 1),
        1,
      );
    });

    test("flat", () => {
      let arr = new ReactiveArray([1, 2, [3]]);

      assert.deepEqual(arr.flat(), [1, 2, 3]);
      assert.deepEqual(arr, [1, 2, [3]]);
    });

    test("flatMap", () => {
      let arr = new ReactiveArray([1, 2, [3]]);

      assert.deepEqual(
        arr.flatMap((v) => (typeof v === "number" ? v + 1 : v)),
        [2, 3, 3],
      );
      assert.deepEqual(arr, [1, 2, [3]]);
    });

    test("forEach", () => {
      let arr = new ReactiveArray([1, 2, 3]);

      arr.forEach((v, i) => assert.equal(v, i + 1));
    });

    test("includes", () => {
      let arr = new ReactiveArray([1, 2, 3]);

      assert.equal(arr.includes(1), true);
      assert.equal(arr.includes(5), false);
    });

    test("indexOf", () => {
      let arr = new ReactiveArray([1, 2, 1]);

      assert.equal(arr.indexOf(1), 0);
      assert.equal(arr.indexOf(5), -1);
    });

    test("join", () => {
      let arr = new ReactiveArray([1, 2, 3]);

      assert.equal(arr.join(","), "1,2,3");
    });

    test("keys", () => {
      let arr = new ReactiveArray([1, 2, 3]);
      let iter = arr.keys();

      assert.equal(iter.next().value, 0);
      assert.equal(iter.next().value, 1);
      assert.equal(iter.next().value, 2);
      assert.equal(iter.next().done, true);
    });

    test("lastIndexOf", () => {
      let arr = new ReactiveArray([3, 2, 3]);

      assert.equal(arr.lastIndexOf(3), 2);
      assert.equal(arr.lastIndexOf(5), -1);
    });

    test("map", () => {
      let arr = new ReactiveArray([1, 2, 3]);
      let arr2 = arr.map((v) => v + 1);

      assert.deepEqual(arr2, [2, 3, 4]);
      assert.notOk(arr2 instanceof ReactiveArray);
    });

    test("pop", () => {
      let arr = new ReactiveArray([1, 2, 3]);
      let val = arr.pop();

      assert.deepEqual(arr, [1, 2]);
      assert.equal(val, 3);
    });

    test("push", () => {
      let arr = new ReactiveArray([1, 2, 3]);
      let val = arr.push(4);

      assert.deepEqual(arr, [1, 2, 3, 4]);
      assert.equal(val, 4);
    });

    test("reduce", () => {
      let arr = new ReactiveArray([1, 2, 3]);

      assert.equal(
        arr.reduce((s, v) => s + v, ""),
        "123",
      );
    });

    test("reduceRight", () => {
      let arr = new ReactiveArray([1, 2, 3]);

      assert.equal(
        arr.reduceRight((s, v) => s + v, ""),
        "321",
      );
    });

    test("reverse", () => {
      let arr = new ReactiveArray([1, 2, 3]);
      arr.reverse();

      assert.deepEqual(arr, [3, 2, 1]);
    });

    test("shift", () => {
      let arr = new ReactiveArray([1, 2, 3]);
      let val = arr.shift();

      assert.deepEqual(arr, [2, 3]);
      assert.equal(val, 1);
    });

    test("slice", () => {
      let arr = new ReactiveArray([1, 2, 3]);
      let arr2 = arr.slice();

      assert.notEqual(arr, arr2);
      assert.notOk(arr2 instanceof ReactiveArray);
      assert.deepEqual(arr, arr2);
    });

    test("some", () => {
      let arr = new ReactiveArray([1, 2, 3]);

      assert.ok(arr.some((v) => v > 1));
      assert.notOk(arr.some((v) => v < 1));
    });

    test("sort", () => {
      let arr = new ReactiveArray([3, 1, 2]);
      let arr2 = arr.sort();

      assert.equal(arr, arr2);
      assert.deepEqual(arr, [1, 2, 3]);
    });

    test("sort (with method)", () => {
      let arr = new ReactiveArray([3, 1, 2, 2]);
      let arr2 = arr.sort((a, b) => {
        if (a > b) return -1;
        if (a < b) return 1;
        return 0;
      });

      assert.equal(arr, arr2);
      assert.deepEqual(arr, [3, 2, 2, 1]);
    });

    test("splice", () => {
      let arr = new ReactiveArray([1, 2, 3]);
      let arr2 = arr.splice(1, 1);

      assert.notOk(arr2 instanceof ReactiveArray);
      assert.deepEqual(arr, [1, 3]);
      assert.deepEqual(arr2, [2]);
    });

    test("unshift", () => {
      let arr = new ReactiveArray([1, 2, 3]);
      let val = arr.unshift(0);

      assert.deepEqual(arr, [0, 1, 2, 3]);
      assert.equal(val, 4);
    });

    test("values", () => {
      let arr = new ReactiveArray([1, 2, 3]);
      let iter = arr.values();

      assert.equal(iter.next().value, 1);
      assert.equal(iter.next().value, 2);
      assert.equal(iter.next().value, 3);
      assert.equal(iter.next().done, true);
    });

    test("of", () => {
      let arr = ReactiveArray.of(1, 2, 3);

      assert.deepEqual(arr, [1, 2, 3]);
    });

    test("from", () => {
      let arr = ReactiveArray.from([1, 2, 3]);

      assert.deepEqual(arr, [1, 2, 3]);
    });
  });

  describe("reactivity", () => {
    test("reassignment is stable", () => {
      let arr = ReactiveArray.from([1, 2, 3]);

      assertReactivelySettled({
        access: () => arr[0],
        change: () => (arr[0] = 4),
      });
    });

    test("length is stable: push", () => {
      let arr = ReactiveArray.from([1, 2, 3]);

      assertReactivelySettled({
        access: () => arr.length,
        change: () => arr.push(4),
      });
    });

    test("length is stable: pop", () => {
      let arr = ReactiveArray.from([1, 2, 3]);

      assertReactivelySettled({
        access: () => arr.length,
        change: () => arr.pop(),
      });
    });

    test("length is stable: unshift", () => {
      let arr = ReactiveArray.from([1, 2, 3]);

      assertReactivelySettled({
        access: () => arr.length,
        change: () => arr.unshift(0),
      });
    });

    test("length is stable: shift", () => {
      let arr = ReactiveArray.from([1, 2, 3]);

      assertReactivelySettled({
        access: () => arr.length,
        change: () => arr.shift(),
      });
    });
  });
});
