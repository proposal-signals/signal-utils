import { describe, it, assert } from "vitest";

import { signal } from "signal-utils";
import { signalObject, SignalObject } from "signal-utils/object";
import { signalArray, SignalArray } from "signal-utils/array";
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
    assert.ok(signalObject());
    assert.ok(new SignalArray());
    assert.ok(signalArray());
    assert.ok(SignalArray.from([]));
    assert.ok(load(Promise.resolve()));
    assert.ok(new SignalAsyncData(Promise.resolve()));
  });
});
