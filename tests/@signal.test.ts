import { describe, it, assert } from "vitest";

import { assertStable, assertReactivelySettled } from "./helpers.ts";
import { signal } from "../src/index.ts";

describe("@signal (accessor)", () => {
  it("works", () => {
    class State {
      @signal accessor #value = 3;

      get doubled() {
        return this.#value * 2;
      }

      increment = () => this.#value++;
    }

    let state = new State();

    assertReactivelySettled({
      access: () => state.doubled,
      change: () => state.increment(),
    });

    assertStable(() => state.doubled);
  });
});

describe("@signal (getter)", () => {
  it("works", () => {
    let cachedCalls = 0;

    class State {
      @signal accessor #value = 3;

      @signal
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
