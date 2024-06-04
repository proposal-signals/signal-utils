import { describe, test, assert } from "vitest";
import { signal } from "../src/index";
import { Transaction } from "../src/transaction";

function getApp() {
  class Obj {
    @signal accessor value = 0;
  }
  const app = new Obj();
  return app;
}

describe("transaction", () => {
  test("rollback should work", () => {
    const app = getApp();
    app.value = 10;
    const transaction = new Transaction();
    transaction.execute(() => {
      app.value = 20;
    });
    assert.equal(app.value, 20);
    transaction.rollback();
    assert.equal(app.value, 10);
  });
  test("commit should work", () => {
    const app = getApp();
    app.value = 10;
    const transaction = new Transaction();
    transaction.execute(() => {
      app.value = 20;
    });
    assert.equal(app.value, 20);
    transaction.commit();
    assert.equal(app.value, 20);
  });
  test("should work with nested transactions", () => {
    const app = getApp();
    app.value = 10;
    const transaction = new Transaction();
    transaction.execute(() => {
      app.value = 20;
      const nestedTransaction = new Transaction();
      nestedTransaction.execute(() => {
        app.value = 30;
      });
      assert.equal(app.value, 30);
      nestedTransaction.rollback();
      assert.equal(app.value, 20);
    });
    assert.equal(app.value, 20);
    transaction.rollback();
    assert.equal(app.value, 10);
  });
  test("should execute mutation in constructor", () => {
    const app = getApp();
    const transaction = new Transaction(() => {
      app.value = 20;
    });
    assert.equal(app.value, 20);
    transaction.rollback();
    assert.equal(app.value, 0);
  });
  test("should work with promises", async () => {
    const app = getApp();
    app.value = 10;
    const transaction = new Transaction(() => {
      app.value = 20;
    });
    const asyncRequest = new Promise((resolve) => {
      setTimeout(() => {
        resolve(true);
      }, 100);
    });
    await transaction.follow(asyncRequest);
    assert.equal(app.value, 20);
  });
  test("should work with promises and rollback", async () => {
    const app = getApp();
    app.value = 10;
    const transaction = new Transaction(() => {
      app.value = 20;
    });
    const asyncRequest = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error("Failed"));
      }, 100);
    });
    try {
      await transaction.follow(asyncRequest);
    } catch (error: any) {
      assert.equal(error.message, "Failed");
      assert.equal(app.value, 10);
    }
  });
});
