import { describe, it, assert } from "vitest";
import { SignalObject } from "signal-utils/object";
import { expectTypeOf } from "expect-type";
import { assertReactivelySettled } from "./helpers.ts";

describe("SignalObject", () => {
  it("works", () => {
    let original = { foo: 123 };
    let obj = new SignalObject(original);

    assert.ok(obj instanceof SignalObject);
    expectTypeOf(obj).toEqualTypeOf<{ foo: number }>();
    assert.deepEqual(Object.keys(obj), ["foo"]);
    assert.equal(obj.foo, 123);

    obj.foo = 456;
    assert.equal(obj.foo, 456, "object updated correctly");
    assert.equal(original.foo, 123, "original object was not updated");

    assertReactivelySettled({
      access: () => obj.foo,
      change: () => (obj.foo += 2),
    });
  });

  it("preserves getters", () => {
    let obj = new SignalObject({
      foo: 123,
      get bar(): number {
        return this.foo;
      },
    });

    expectTypeOf(obj).toEqualTypeOf<{ foo: number; readonly bar: number }>();

    obj.foo = 456;
    assert.equal(obj.foo, 456, "object updated correctly");
    assert.equal(obj.bar, 456, "getter cloned correctly");

    assertReactivelySettled({
      access: () => obj.bar,
      change: () => {
        obj.foo += 2;

        assert.equal(obj.foo, 458, "foo is updated");
        assert.equal(obj.bar, 458, "bar is updated");
      },
    });
  });

  it("works with methods", () => {
    let obj = new SignalObject({
      foo: 123,

      method() {
        return this.foo;
      },
    });

    expectTypeOf(obj).toEqualTypeOf<{ foo: number; method: () => number }>();

    assertReactivelySettled({
      access: () => obj.method(),
      change: () => {
        obj.foo += 2;
      },
    });
  });

  it("fromEntries", () => {
    const entries = Object.entries({ foo: 123 });
    let obj = SignalObject.fromEntries(entries);
    // We will lose the specific key, becuase `Object.entries` does not preserve
    // it, but the type produced by `TrackedObject.fromEntries` should match the
    // type produced by `Object.fromEntries`.
    let underlying = Object.fromEntries(entries);
    expectTypeOf(obj).toEqualTypeOf(underlying);

    assert.ok(obj instanceof SignalObject);
    assert.deepEqual(Object.keys(obj), ["foo"]);

    assertReactivelySettled({
      access: () => obj["foo"],
      change: () => {
        obj["foo"] += 2;
      },
    });
  });
});
