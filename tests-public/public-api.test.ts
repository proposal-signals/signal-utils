import { describe, it, assert } from "vitest";

import { signal } from "signal-utils";
import { ReactiveObject } from "signal-utils/object";

describe("Public API", () => {
  it("exists", () => {
    class State {
      @signal accessor a = 2;
      @signal accessor b = "str";
    }

    let state = new State();

    assert.ok(state);
    assert.ok(new ReactiveObject());
  });
});
