import { describe, it, assert } from "vitest";

import { signal } from "../src";
import { signalObject, SignalObject } from "../src/object";
import { signalArray, SignalArray } from "../src/array";
import { load, SignalAsyncData } from "../src/async-data";

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
