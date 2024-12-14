import { Signal } from "signal-polyfill";

const STATE_SYMBOL = Symbol.for("___state___");
const MEMO_SYMBOL = Symbol.for("___memo___");

type Store<T> =
    {
        [K in keyof T]: T[K] extends Signal.State<infer U>
            ? U
            : T[K] extends Signal.Computed<infer U>
                ? U
                : T[K] extends State<infer U>
                    ? U
                    : T[K] extends Memo<infer U>
                        ? U
                        : T[K]
    };

/**
 * Creates a reactive store from an initial object. The store proxies the initial object,
 * maintaining reactivity for its properties. It supports nested objects, getters, functions,
 * and reactive signals (state and computed).
 *
 * @param initObj - The initial object to create the store from.
 * @param isDeep - Whether to recursively make nested objects reactive. Defaults to `false`.
 *
 * @returns A reactive store that proxies the initial object.
 *
 * @example
 * ```ts
 * const store = makeStore({
 *   count: makeState(0),
 *   doubled: makeMemo(() => store.count * 2),
 *   increment() {
 *     store.count++;
 *   }
 * });
 *
 * console.log(store.count); // 0
 * console.log(store.doubled); // 0
 * store.increment();
 * console.log(store.count); // 1
 * console.log(store.doubled); // 2
 * ```
 *
 * @category Store
 */

function makeStore<T extends object>(initObj: T, isDeep: boolean = false): Store<T> {
    // Base case which mostly for a recursive call of deep
    // Deep shouldn't be called on a primitive number/string/boolean/etc
    // It wont create a signal

    if (initObj == null || typeof initObj !== "object") {
        return initObj as Store<T>;
    }

    const fakeProxy = {} as Store<T>;
    const keys = Object.keys(initObj) as (keyof T)[];

    keys.forEach((key) => {
        const descriptor = Object.getOwnPropertyDescriptor(initObj, key);

        if(descriptor === undefined){
            return;
        }

        // Maintain getters
        const getter = descriptor!.get;
        if (getter) {
            Object.defineProperty(fakeProxy, key, {
                get: () => {
                    return getter();
                },
            });
            return;
        }

        const initValue = initObj[key as keyof T];
        // Roll other functions over
        if (typeof initValue === "function") {
            fakeProxy[key] = initValue as Store<T>[keyof T];
        }

        // For makeMemo
        else if (typeof initObj[key] === "object" && (initObj[key] as any)[MEMO_SYMBOL]) {
            Object.defineProperty(fakeProxy, key, {
                get: () => {
                    return (initObj[key] as Memo<unknown>).value;
                },
            });
        }

        // For makeState
        else if (typeof initObj[key] === "object" && (initObj[key] as any)[STATE_SYMBOL]) {
            Object.defineProperty(fakeProxy, key, {
                get: () => {
                    return (initObj[key] as State<unknown>).value;
                },
                set: (val) => {
                    (initObj[key] as State<unknown>).value = val;
                },
            });
        }

        // Maintain Computeds
        else if (
            typeof initObj[key] === "object" &&
            Signal.isComputed(initObj[key])
        ) {
            Object.defineProperty(fakeProxy, key, {
                get: () => {
                    return (initObj[key] as Signal.Computed<unknown>).get();
                },
            });
        }

        // Maintain Signals
        else if (
            typeof initObj[key] === "object" &&
            Signal.isState(initObj[key])
        ) {
            Object.defineProperty(fakeProxy, key, {
                get: () => {
                    return (initObj[key] as Signal.State<unknown>).get();
                },
                set: (val) => {
                    (initObj[key] as Signal.State<unknown>).set(val);
                },
            });
        } else {
            let storage: Signal.State<T[keyof T] | Store<T[keyof T] & object>>;
            let valueBeforeGet = initObj[key];
            Object.defineProperty(fakeProxy, key, {
                get: () => {
                    if (!storage) {
                        storage = new Signal.State(
                            isDeep && typeof valueBeforeGet === "object" && valueBeforeGet !== null
                                ? makeStore(valueBeforeGet, true)
                                : valueBeforeGet,
                        );
                    }
                    return storage.get();
                },
                set: (value) => {
                    if (!storage) {
                        valueBeforeGet = value;
                    } else {
                        storage.set(isDeep ? makeStore(value, true) : value);
                    }
                },
            });
        }
    });

    return fakeProxy;
}

type State<T> = { value: T };
function makeState<T>(value: T): State<T> {
    const store = makeStore({
        value: new Signal.State(value),
    });
    // Branding for use in stores
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Don't want to expose brand in types
    (store as any)[STATE_SYMBOL] = true;
    return store as State<T>;
}

type Memo<T> = { readonly value: T };
function makeMemo<T>(fn: () => T): Memo<T> {
    const store = makeStore({
        value: new Signal.Computed(fn),
    });
    // Branding for use in stores
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Don't want to expose brand in types
    (store as any)[MEMO_SYMBOL] = true;
    return store as Memo<T>;
}

export { makeState, makeMemo, makeStore, type State, type Memo, type Store };
