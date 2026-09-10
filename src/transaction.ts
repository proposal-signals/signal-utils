import type { Signal } from "signal-polyfill";

type Mutation = () => void;

let activeTransaction: Transaction | null = null;
const activeTransactions: Transaction[] = [];
const createdTransactions: Set<Transaction> = new Set();
export function popActiveTransaction(): void {
  activeTransactions.pop();
  activeTransaction = activeTransactions[activeTransactions.length - 1] || null;
}
export function pushActiveTransaction(transaction: Transaction): void {
  activeTransactions.push(transaction);
  activeTransaction = transaction;
}

export function signalTransactionSetter(
  signal: Signal.State<any>,
  value: any,
): void {
  if (activeTransaction) {
    const { cellState, usedCells, seenCells } = activeTransaction;
    if (!cellState.has(signal)) {
      usedCells.add(signal);
    }
    seenCells.add(signal);
    cellState.set(signal, value);
  } else {
    signal.set(value);
  }
}
export function signalTransactionGetter(signal: Signal.State<any>): any {
  if (activeTransaction) {
    const { cellState, usedCells } = activeTransaction;
    if (usedCells.has(signal)) {
      return cellState.get(signal);
    }
  }
  return signal.get();
}

export class Transaction {
  constructor(fn?: Mutation) {
    if (fn) {
      this.execute(fn);
    }
  }
  cellState: WeakMap<Signal.State<any>, unknown> = new WeakMap();
  usedCells: Set<Signal.State<any>> = new Set();
  seenCells: WeakSet<Signal.State<any>> = new WeakSet();
  prevSeenCells: Set<WeakSet<Signal.State<any>>> = new Set();
  execute(fn: Mutation): void {
    createdTransactions.add(this);
    try {
      pushActiveTransaction(this);
      fn();
    } finally {
      popActiveTransaction();
    }
  }
  ensureSafeToCommit() {
    this.usedCells.forEach((signal) => {
      for (const prevSeen of this.prevSeenCells) {
        if (prevSeen.has(signal)) {
          throw new Error("Transaction conflict");
        }
      }
    });
  }
  commit(fn?: Mutation): void {
    if (fn) {
      this.execute(fn);
    }
    this.ensureSafeToCommit();
    const parentTransaction =
      activeTransactions[activeTransactions.length - 1] || null;
    if (parentTransaction) {
      const { usedCells, cellState } = parentTransaction;
      this.usedCells.forEach((signal) => {
        usedCells.add(signal);
        cellState.set(signal, this.cellState.get(signal));
      });
    } else {
      this.usedCells.forEach((signal) => {
        signal.set(this.cellState.get(signal));
      });
    }
    for (const t of createdTransactions) {
      if (t !== this && !activeTransactions.includes(t)) {
        t.prevSeenCells.add(t.seenCells);
      }
    }
    this.cleanup();
  }
  rollback(): void {
    this.cleanup();
  }
  cleanup(): void {
    createdTransactions.delete(this);
    this.cellState = new WeakMap();
    this.usedCells = new Set();
    this.seenCells = new WeakSet();
    this.prevSeenCells = new Set();
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
