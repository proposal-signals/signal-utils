import { describe, test, assert } from "vitest";
import { localCopy } from "../src/local-copy.ts";
import { Signal } from "signal-polyfill";
import { assertReactivelySettled, assertStable } from "./helpers.ts";

describe("localCopy()", () => {
  test("it works as a Signal", () => {
    let remote = new Signal.State(123);

    let local = localCopy(() => remote.get());

    assert.strictEqual(local.get(), 123, "defaults to the remote value");

    assertReactivelySettled({
      access: () => local.get(),
      change: () => local.set(456),
    });

    assert.strictEqual(local.get(), 456, "local value updates correctly");
    assert.strictEqual(remote.get(), 123, "remote value does not update");

    remote.set(789);

    assert.strictEqual(
      local.get(),
      789,
      "local value updates to new remote value",
    );
    assert.strictEqual(remote.get(), 789, "remote value is updated");

    assertStable(() => local.get());
  });

  test("it works as a Signal in a class", () => {
    class State {
      remote = new Signal.State(123);
      local = localCopy(() => this.remote.get());
    }

    let state = new State();

    assert.strictEqual(state.local.get(), 123, "defaults to the remote value");

    assertReactivelySettled({
      access: () => state.local.get(),
      change: () => state.local.set(456),
    });

    assert.strictEqual(state.local.get(), 456, "local value updates correctly");
    assert.strictEqual(state.remote.get(), 123, "remote value does not update");

    state.remote.set(789);

    assert.strictEqual(
      state.local.get(),
      789,
      "local value updates to new remote value",
    );
    assert.strictEqual(state.remote.get(), 789, "remote value is updated");

    assertStable(() => state.local.get());
  });

  test("it correctly updates when remote value was reverted", () => {
    let remote = new Signal.State(123);

    let local = localCopy(() => remote.get());

    local.set(789);

    remote.set(456);
    remote.set(123);

    assert.strictEqual(local.get(), 123, "local value updates correctly");

    assertStable(() => local.get());
  });
});
