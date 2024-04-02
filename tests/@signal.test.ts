import { describe, it } from "vitest";

import { assertStable, assertReactivelySettled } from "./helpers.ts";
import { signal } from "signal-utils";

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

    assertReactivelySettled({
      access: () => state.doubled,
      change: () => state.increment(),
    });

    assertStable(() => state.doubled);
  });
});
