import { describe, it, assert } from "vitest";

import { signal } from "signal-utils";
import { Signal } from "signal-polyfill";

describe("@signal", () => {
  it("works", () => {
    class State {
      @signal accessor #value = 3;

      get doubled() {
        return this.#value * 2;
      }

      increment = () => this.#value++;
    }

    let state = new State();

    let calls = 0;
    const computed = new Signal.Computed(() => {
      calls++;
      return state.doubled;
    });

    assert.equal(state.doubled, 6);
    assert.equal(computed.get(), 6);
    assert.equal(calls, 1);

    state.increment();

    assert.equal(state.doubled, 8);
    assert.equal(computed.get(), 8);
    assert.equal(calls, 2);

    // Is Stable
    assert.equal(computed.get(), 8);
    assert.equal(calls, 2);
  });
});
