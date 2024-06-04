import type { Signal } from "signal-polyfill";

type Mutation = () => void;
let activeTransaction: null | Transaction = null;

export function setActiveTransaction(transaction: Transaction | null): void {
  activeTransaction = transaction;
}

export function signalTransactionSetter(signal: Signal.State<any>): void {
  if (activeTransaction) {
    const { cellState, usedCells } = activeTransaction;
    if (!cellState.has(signal)) {
      cellState.set(signal, signal.get());
      usedCells.add(signal);
    }
  }
}

export class Transaction {
  constructor(fn?: Mutation) {
    if (fn) {
      this.execute(fn);
    }
  }
  cellState: WeakMap<Signal.State<any>, unknown> = new WeakMap();
  usedCells: Set<Signal.State<any>> = new Set();
  execute(fn: Mutation): void {
    try {
      setActiveTransaction(this);
      fn();
    } finally {
      setActiveTransaction(null);
    }
  }
  commit(fn?: Mutation): void {
    if (fn) {
      this.execute(fn);
    }
    this.cleanup();
  }
  rollback(): void {
    this.usedCells.forEach((signal) => {
      signal.set(this.cellState.get(signal));
    });
    this.cleanup();
  }
  cleanup(): void {
    this.cellState = new WeakMap();
    this.usedCells = new Set();
  }
  follow(promise: Promise<any>): Promise<any> {
    return promise
      .then((result) => {
        this.commit();
        return result;
      })
      .catch((error) => {
        this.rollback();
        return Promise.reject(error);
      });
  }
}

/* Usage sample: 

    Let's say we managing add user form, we have input with user name and list of users.
    We have a state object that holds the user name and list of users.

    class App {
        @signal userName = '';
        @signal users = [];
        async addUser() {
            const addUserTransaction = new Transaction();
            // optimistic update
            addUserTransaction.execute(() => {
                this.users = [...this.users, this.userName];
                this.userName = '';
            });
            fetch('/api/add-user', {
                method: 'POST',
                body: JSON.stringify({ userName: this.userName }),

            )).then(async (req) => {
                const serverUsers = await req.json();
                // commit the transaction
                addUserTransaction.commit(() => {
                    this.users = serverUsers;
                });
            }).catch(() => {
                // rollback the transaction
                addUserTransaction.rollback();
            });
        }

    }

*/
