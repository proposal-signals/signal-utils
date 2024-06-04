import { describe, test, assert } from "vitest";
import { signal } from "../src/index";
import { Transaction } from "../src/transaction";

function getApp(initValue: any = 0) {
  class Obj {
    @signal accessor value = initValue;
  }
  const app = new Obj();
  return app;
}

describe("transaction", () => {
  test("rollback should work", () => {
    const app = getApp(10);
    const transaction = new Transaction();
    transaction.execute(() => {
      app.value = 20;
    });
    assert.equal(app.value, 10);
    transaction.rollback();
    assert.equal(app.value, 10);
  });
  test("commit should work", () => {
    const app = getApp(10);
    const transaction = new Transaction();
    transaction.execute(() => {
      app.value = 20;
    });
    assert.equal(app.value, 10);
    transaction.commit();
    assert.equal(app.value, 20);
  });
  test("should work with nested transactions", () => {
    const app = getApp(10);
    const transaction = new Transaction();
    transaction.execute(() => {
      app.value = 20;
      const nestedTransaction = new Transaction();
      nestedTransaction.execute(() => {
        app.value = 30;
        assert.equal(app.value, 30);
      });
      assert.equal(app.value, 20);
      nestedTransaction.rollback();
      assert.equal(app.value, 20);
    });
    assert.equal(app.value, 10);
    transaction.commit();
    assert.equal(app.value, 20);
  });
  test("nested transactions should not affect each other", () => {
    const app = getApp(10);
    const transaction = new Transaction();
    transaction.execute(() => {
      app.value = 20;
      const nestedTransaction = new Transaction();
      nestedTransaction.execute(() => {
        app.value = 30;
        assert.equal(app.value, 30);
      });
      assert.equal(app.value, 20);
      nestedTransaction.commit();
      assert.equal(app.value, 30);
    });
    assert.equal(app.value, 10);
    transaction.commit();
    assert.equal(app.value, 30);
  });
  test("no error appears if value mutation appears in parent and child transaction", () => {
    const app = getApp(10);
    const transaction = new Transaction();
    transaction.execute(() => {
      app.value = 20;
      const nestedTransaction = new Transaction();
      nestedTransaction.execute(() => {
        app.value = 30;
        assert.equal(app.value, 30);
      });
      app.value = 40;
      assert.equal(app.value, 40);
      nestedTransaction.commit();
      assert.equal(app.value, 30);
    });
    assert.equal(app.value, 10);
    transaction.commit();
    assert.equal(app.value, 30);
  });
  test("should execute mutation in constructor", () => {
    const app = getApp(10);
    const transaction = new Transaction(() => {
      app.value = 20;
    });
    assert.equal(app.value, 10);
    transaction.execute(() => {
      assert.equal(app.value, 20);
    });
    transaction.rollback();
    assert.equal(app.value, 10);
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
  test("Changes made outside of a transaction are not visible within the transaction.", async () => {
    const app = getApp(10);
    assert.equal(app.value, 10);
    const transaction = new Transaction(() => {
      app.value = 20;
      assert.equal(app.value, 20);
    });
    app.value = 30;
    assert.equal(app.value, 30);
    transaction.execute(() => {
      assert.equal(app.value, 20);
    });
    transaction.rollback();
    assert.equal(app.value, 30);
  });
  test("Changes made within the transaction are not visible outside of the transaction until it commits.", async () => {
    const app = getApp(10);
    assert.equal(app.value, 10);
    const transaction = new Transaction(() => {
      app.value = 20;
      assert.equal(app.value, 20);
    });
    assert.equal(app.value, 10);
    transaction.commit();
    assert.equal(app.value, 20);
  });
  test("Transactions fail to commit if they conflict with another transaction in some way (e.g. during the transaction a piece of data that was read or modified was changed by another transaction which committed first)", async () => {
    const app = getApp(10);
    const transaction1 = new Transaction(() => {
      app.value = 20;
    });
    const transaction2 = new Transaction(() => {
      app.value = 30;
    });
    let isErrored = false;
    transaction1.commit();
    assert.equal(app.value, 20);
    try {
      transaction2.commit();
    } catch (error: any) {
      isErrored = true;
      assert.equal(error.message, "Transaction conflict");
      assert.equal(app.value, 20);
    }
    assert.equal(isErrored, true);
  });
});
