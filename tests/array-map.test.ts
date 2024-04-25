import { describe, test, assert } from "vitest";

import { signal } from "../src/index.ts";
import { arrayMap } from "../src/array-map.ts";

describe("arrayMap", function () {
  class Wrapper {
    constructor(public record: unknown) {}
  }

  interface TestRecord {
    id: number;
    someProp?: string;
  }

  class ExampleTrackedThing {
    @signal accessor id: number;
    @signal accessor someValue = "";

    constructor(id: number) {
      this.id = id;
    }
  }

  function testData(id: number) {
    return new ExampleTrackedThing(id);
  }

  test(`it works`, function () {
    let steps: string[] = [];

    const verifySteps = (expected: string[], message: string) => {
      assert.deepEqual(steps, expected, message);
      // clear
      steps.length = 0;
    };

    class Test {
      @signal accessor records: TestRecord[] = [];
    }

    let currentStuff: Wrapper[] = [];
    let instance = new Test();

    const stuff = arrayMap({
      data: () => {
        steps.push("evaluate data thunk");

        return instance.records;
      },
      map: (record) => {
        steps.push(`perform map on ${record.id}`);

        return new Wrapper(record);
      },
    });

    const get = (index: number) => stuff[index];

    assert.strictEqual(stuff.length, 0);
    verifySteps(
      ["evaluate data thunk"],
      "❯❯ initially, the data fn is consumed",
    );

    let first = testData(1);
    let second = testData(2);

    instance.records = [first, second];
    assert.strictEqual(stuff.length, 2, "length adjusted");
    verifySteps(
      ["evaluate data thunk"],
      "❯❯ we do not map yet because the data has not been accessed",
    );

    assert.ok(get(0) instanceof Wrapper, "access id:1");
    assert.ok(get(1) instanceof Wrapper, "access id:2");
    verifySteps(
      ["perform map on 1", "perform map on 2"],
      "❯❯ accessing indicies calls the mapper",
    );

    assert.ok(get(0) instanceof Wrapper, "access id:1");
    assert.ok(get(1) instanceof Wrapper, "access id:2");
    verifySteps([], "❯❯ re-access is a no-op");

    // this tests the iterator
    currentStuff = [...stuff];
    assert.ok(stuff.values()[0] instanceof Wrapper, "mappedRecords id:1");
    assert.ok(stuff.values()[1] instanceof Wrapper, "mappedRecords id:2");

    assert.strictEqual(
      currentStuff[0]?.record,
      first,
      "object equality retained",
    );
    assert.strictEqual(
      currentStuff[1]?.record,
      second,
      "object equality retained",
    );

    instance.records = [...instance.records, testData(3)];
    assert.strictEqual(stuff.length, 3, "length adjusted");
    verifySteps(
      ["evaluate data thunk"],
      "❯❯ we do not map on the new object yet because the data has not been accessed",
    );

    assert.ok(get(0) instanceof Wrapper, "access id:1");
    assert.ok(get(1) instanceof Wrapper, "access id:2");
    assert.ok(get(2) instanceof Wrapper, "access id:3");
    assert.strictEqual(get(0), currentStuff[0], "original objects retained");
    assert.strictEqual(get(1), currentStuff[1], "original objects retained");
    verifySteps(
      ["perform map on 3"],
      "❯❯ only calls map once, even though the whole source data was re-created",
    );

    first.someValue = "throwaway value";
    verifySteps(
      [],
      "❯❯ data thunk is not ran, because the tracked data consumed in the thunk was not changed",
    );
    assert.strictEqual(get(0), currentStuff[0], "original objects retained");
    assert.strictEqual(get(1), currentStuff[1], "original objects retained");
  });
});
