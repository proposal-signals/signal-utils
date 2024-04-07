import { describe, it, assert } from "vitest";
import { signal } from "../src/index.ts";
import { cached } from "../src/cached.ts";

import { assertStable, assertReactivelySettled } from "./helpers.ts";

describe("@cached", () => {
  it("works", () => {
    let cachedCalls = 0;

    class State {
      @signal accessor #value = 3;

      @cached
      get doubled() {
        cachedCalls++;
        return this.#value * 2;
      }

      increment = () => this.#value++;
    }

    let state = new State();

    assert.strictEqual(cachedCalls, 0);

    assertReactivelySettled({
      access: () => state.doubled,
      change: () => state.increment(),
    });

    assert.strictEqual(cachedCalls, 2);

    assertStable(() => state.doubled);

    // No more evaluation of the getter
    assert.strictEqual(cachedCalls, 2);
    state.doubled;
    assert.strictEqual(cachedCalls, 2);
    state.doubled;
    assert.strictEqual(cachedCalls, 2);
  });
});
