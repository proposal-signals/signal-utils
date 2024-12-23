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

  it("errors when used with a setter", () => {
    assert.throws(() => {
      class State {
        #value = 3;

        @signal
        get doubled() {
          return this.#value * 2;
        }
        // Deliberate incorrect usage to test a runtime error
        // @ts-expect-error
        @signal
        set doubled(_v) {
          // what would we even set
        }
      }

      new State();
    }, /@signal can only be used on accessors or getters/);
  });

  it("not shared between instances", () => {
    class State {
      @signal accessor #value = 3;

      @signal
      get doubled() {
        return this.#value * 2;
      }

      constructor(value: number) {
        this.#value = value;
      }
    }

    let state1 = new State(1);
    let state2 = new State(2);

    assert.strictEqual(state1.doubled, 2);
    assert.strictEqual(state2.doubled, 4);
  });
});
