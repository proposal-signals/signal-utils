import { describe, it, assert } from "vitest";

import { signal } from "signal-utils";
import { SignalObject } from "signal-utils/object";
import { SignalArray } from "signal-utils/array";
import { load, SignalAsyncData } from "signal-utils/async-data";

describe("Public API", () => {
  it("exists", () => {
    class State {
      @signal accessor a = 2;
      @signal accessor b = "str";
    }

    let state = new State();

    assert.ok(state);
    assert.ok(new SignalObject());
    assert.ok(new SignalArray());
    assert.ok(SignalArray.from([]));
    assert.ok(load(Promise.resolve()));
    assert.ok(new SignalAsyncData(Promise.resolve()));
  });
});
