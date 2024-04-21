import { signal } from "../src/index.ts";
import { guard } from "./helpers";
import { describe, test, assert } from "vitest";
import { deepSignal, deep } from "../src/deep.ts";
import { assertReactivelySettled } from "./helpers.ts";

/**
 * How do you type deep objects? is it possible?
 */
describe("deep", () => {
  test("object access", () => {
    let reactive = deep({}) as any;

    assert.notOk(reactive.obj?.foo?.bar);

    reactive.obj = { foo: { bar: 2 } };

    assert.strictEqual(reactive.obj?.foo?.bar, 2);

    assertReactivelySettled({
      access: () => reactive.foo,
      change: () => (reactive.foo += 2),
    });
  });

  test("array access", () => {
    let reactive = deep([]) as any;

    assert.notOk(reactive[0]);

    reactive[0] = true;

    assert.strictEqual(reactive[0], true);

    assertReactivelySettled({
      access: () => reactive[1],
      change: () => (reactive[1] += 2),
    });
  });

  describe("unproxyable", () => {
    let values = [undefined, null, true, false, 1, "", NaN, "foo"];

    for (let value of values) {
      test(`'${value}' stays '${value}'`, () => {
        let reactive = deep(value);

        if (Number.isNaN(value)) {
          assert.ok(Number.isNaN(reactive));
        } else {
          assert.strictEqual(reactive, value);
        }
      });
    }
  });

  test("multiple assignments", () => {
    let reactive = deep({}) as any;

    assert.strictEqual(reactive.obj, undefined);
    assert.strictEqual(reactive.obj?.bar, undefined);
    assert.strictEqual(
      reactive.obj,
      undefined,
      `accessing deep values does not create objects`,
    );

    // Deep setting should be allowed?
    reactive.obj = {};
    reactive.obj.bar = 2;
    assert.strictEqual(reactive.obj?.bar, 2);
    assert.deepEqual(reactive.obj, { bar: 2 });
  });
});

describe("deepSignal", function () {
  describe("Objects", function () {
    test("object access", async function () {
      class Foo {
        @deepSignal accessor obj = {} as any;

        @signal
        get objDeep() {
          return this.obj.foo?.bar;
        }
      }

      let instance = new Foo();

      assert.notOk(instance.objDeep);

      instance.obj.foo = { bar: 3 };
      assert.strictEqual(instance.objDeep, 3);

      instance.obj.foo = { bar: 4 };
      assert.strictEqual(instance.objDeep, 4);

      instance.obj = { foo: { bar: 5 } };
      assert.strictEqual(instance.objDeep, 5);

      instance.obj.foo = { bar: 4 };
      assert.strictEqual(instance.objDeep, 4);
    });

    test("object access in an array", async function () {
      class Foo {
        @deepSignal accessor arr: any[] = [];

        @signal
        get arrDeep() {
          return this.arr[0]?.foo?.bar;
        }
      }

      let instance = new Foo();

      assert.notOk(instance.arrDeep);

      instance.arr.push({ foo: { bar: 2 } });

      assert.strictEqual(instance.arrDeep, 2);
    });

    test("undefined to object", async function () {
      class Foo {
        @deepSignal accessor obj: Record<string, any> | undefined = undefined;
      }

      let instance = new Foo();

      assert.strictEqual(instance.obj, null);

      instance.obj = {};

      assert.deepEqual(instance.obj, {});
    });

    test("null to object", async function () {
      class Foo {
        @deepSignal accessor obj: Record<string, any> | null = null;
      }

      let instance = new Foo();

      assert.strictEqual(instance.obj, null);

      instance.obj = {};

      assert.deepEqual(instance.obj, {});
    });
  });

  describe("Arrays", function () {
    describe("#splice", function () {
      test("it works", async function () {
        class Foo {
          @deepSignal accessor arr: any[] = [0, 1, 3];

          @signal
          get arrDeep() {
            return this.arr[0]?.foo?.bar;
          }
        }

        let instance = new Foo();

        instance.arr.splice(1, 1);

        assert.deepEqual(instance.arr, [0, 3]);
      });

      test("it works on deeply nested arrays", async function () {
        class Foo {
          @deepSignal accessor obj = { children: [{ property: [0, 1, 3] }] };

          splice = () => {
            guard(
              `Test failed to define an array on obj.children`,
              this.obj.children[0],
            );

            return this.obj.children[0].property.splice(1, 1);
          };

          @signal
          get output() {
            guard(
              `Test failed to define an array on obj.children`,
              this.obj.children[0],
            );

            return this.obj.children[0].property;
          }
        }

        let instance = new Foo();

        assert.deepEqual(instance.output, [0, 1, 3]);
        instance.splice();
        assert.deepEqual(instance.output, [0, 3]);
      });
    });

    test("#indexOf works", async function () {
      class Foo {
        @deepSignal accessor arr = [] as any;

        get item1() {
          return arr[0];
        }
      }

      let instance = new Foo();

      const item1 = { bar: "baz" };
      const item2 = { qux: "norf" };

      instance.arr.push(item1);
      instance.arr.push(item2);

      let arr = instance.arr;
      let first = arr.indexOf(instance.item1);
      let second = arr.indexOf(item2);

      assert.strictEqual(first, 0);
      assert.strictEqual(second, 1);
    });

    test("#indexOf works multiple times", async function () {
      class Foo {
        @deepSignal accessor arr = [] as any;
      }

      let instance = new Foo();

      const item = { bar: "baz" };

      instance.arr.push(item);

      let arr = instance.arr;
      let first = arr.indexOf(item);
      let second = arr.indexOf(item);

      assert.strictEqual(first, 0);
      assert.strictEqual(second, 0);
    });
  });

  test("array data can be re-set", async function () {
    class Foo {
      @deepSignal accessor arr: any[] = [0, 1, 3];

      @signal
      get arrDeep() {
        return this.arr[0]?.foo?.bar;
      }
    }

    let instance = new Foo();

    instance.arr = [4, 8];

    assert.deepEqual(instance.arr, [4, 8]);
  });

  test("array data can be immutably treated", async function () {
    class Foo {
      @deepSignal accessor arr: { id: number; prop: string }[] = [
        {
          id: 1,
          prop: "foo",
        },
        {
          id: 2,
          prop: "bar",
        },
        {
          id: 3,
          prop: "baz",
        },
      ];
    }

    let instance = new Foo();

    assert.deepEqual(instance.arr, [
      {
        id: 1,
        prop: "foo",
      },
      {
        id: 2,
        prop: "bar",
      },
      {
        id: 3,
        prop: "baz",
      },
    ]);

    instance.arr = instance.arr.map((el) => {
      if (el.id === 2) {
        return {
          ...el,
          prop: "boink",
        };
      }

      return el;
    });

    assert.deepEqual(instance.arr, [
      {
        id: 1,
        prop: "foo",
      },
      {
        id: 2,
        prop: "boink",
      },
      {
        id: 3,
        prop: "baz",
      },
    ]);
  });
});
