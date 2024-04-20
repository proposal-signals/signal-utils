import { cached } from '../src/cached';
import { guard } from './helpers';
import { describe, test, assert } from 'vitest';
import { signal, deep } from '../src/deep.ts';

describe('deep signal', function() {
  describe('Objects', function() {
    test('object access', async function() {
      class Foo {
        @signal obj = {} as any;

        @cached
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

    test('object access in an array', async function() {
      class Foo {
        @signal arr: any[] = [];

        @cached
        get arrDeep() {
          return this.arr[0]?.foo?.bar;
        }
      }

      let instance = new Foo();

      assert.notOk(instance.arrDeep);

      instance.arr.push({ foo: { bar: 2 } });

      assert.strictEqual(instance.arrDeep, 2);
    });

    test('undefined to object', async function() {
      class Foo {
        @signal obj?: Record<string, any>;
      }

      let instance = new Foo();

      assert.strictEqual(instance.obj, null);

      instance.obj = {};

      assert.deepEqual(instance.obj, {});
    });

    test('null to object', async function() {
      class Foo {
        @signal obj: Record<string, any> | null = null;
      }

      let instance = new Foo();

      assert.strictEqual(instance.obj, null);

      instance.obj = {};

      assert.deepEqual(instance.obj, {});
    });
  });

  describe('Arrays', function() {
    describe('#splice', function() {
      test('it works', async function() {
        class Foo {
          @signal arr: any[] = [0, 1, 3];

          @cached
          get arrDeep() {
            return this.arr[0]?.foo?.bar;
          }
        }

        let instance = new Foo();

        instance.arr.splice(1, 1);

        assert.deepEqual(instance.arr, [0, 3]);
      });

      test('it works on deeply nested arrays', async function() {
        class Foo {
          @signal obj = { children: [{ property: [0, 1, 3] }] };

          splice = () => {
            guard(`Test failed to define an array on obj.children`, this.obj.children[0]);

            return this.obj.children[0].property.splice(1, 1);
          };

          @cached
          get output() {
            guard(`Test failed to define an array on obj.children`, this.obj.children[0]);

            return this.obj.children[0].property;
          }
        }

        let instance = new Foo();

        assert.deepEqual(instance.output, [0, 1, 3]);
        instance.splice();
        assert.deepEqual(instance.output, [0, 3]);
      });
    });

    test('#indexOf works', async function() {
      class Foo {
        @signal arr = [] as any;

        get item1() {
          return arr[0];
        }
      }

      let instance = new Foo();

      const item1 = { bar: 'baz' };
      const item2 = { qux: 'norf' };

      instance.arr.push(item1);
      instance.arr.push(item2);

      let arr = instance.arr;
      let first = arr.indexOf(instance.item1);
      let second = arr.indexOf(item2);

      assert.strictEqual(first, 0);
      assert.strictEqual(second, 1);
    });

    test('#indexOf works multiple times', async function() {
      class Foo {
        @signal arr = [] as any;
      }

      let instance = new Foo();

      const item = { bar: 'baz' };

      instance.arr.push(item);

      let arr = instance.arr;
      let first = arr.indexOf(item);
      let second = arr.indexOf(item);

      assert.strictEqual(first, 0);
      assert.strictEqual(second, 0);
    });
  });

  test('array data can be re-set', async function() {
    class Foo {
      @signal arr: any[] = [0, 1, 3];

      @cached
      get arrDeep() {
        return this.arr[0]?.foo?.bar;
      }
    }

    let instance = new Foo();

    instance.arr = [4, 8];

    assert.deepEqual(instance.arr, [4, 8]);
  });

  test('array data can be immutably treated', async function() {
    class Foo {
      @signal
      arr: { id: number; prop: string }[] = [
        {
          id: 1,
          prop: 'foo',
        },
        {
          id: 2,
          prop: 'bar',
        },
        {
          id: 3,
          prop: 'baz',
        },
      ];
    }

    let instance = new Foo();

    assert.deepEqual(instance.arr, [
      {
        id: 1,
        prop: 'foo',
      },
      {
        id: 2,
        prop: 'bar',
      },
      {
        id: 3,
        prop: 'baz',
      },
    ]);

    instance.arr = instance.arr.map((el) => {
      if (el.id === 2) {
        return {
          ...el,
          prop: 'boink',
        };
      }

      return el;
    });

    assert.deepEqual(instance.arr, [
      {
        id: 1,
        prop: 'foo',
      },
      {
        id: 2,
        prop: 'boink',
      },
      {
        id: 3,
        prop: 'baz',
      },
    ]);
  });
});

