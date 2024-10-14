import { Signal } from "signal-polyfill";

const STATE_SYMBOL = Symbol.for("___state___");
const MEMO_SYMBOL = Symbol.for("___memo___");

type Store<T> = T extends object
    ? {
          [K in keyof T]: T[K] extends Signal.State<infer U>
              ? U
              : T[K] extends Signal.Computed<infer U>
                ? U
                : T[K];
      }
    : T;

function makeStore<T>(initObj: T, isDeep: boolean = false): Store<T> {
    // Base case which mostly for a recursive call of deep
    // Deep shouldn't be called on a primitive number/string/boolean/etc
    // It wont create a signal
    if (typeof initObj !== "object") {
        return initObj as Store<T>;
    }

    const fakeProxy = {} as Store<T>;
    const keys = Object.keys(initObj);
    keys.forEach((key) => {
        const descriptor = Object.getOwnPropertyDescriptor(initObj, key);

        // Maintain getters
        if (descriptor.get) {
            Object.defineProperty(fakeProxy, key, {
                get: () => {
                    return descriptor.get();
                },
            });
        }

        // Roll other functions over
        else if (typeof initObj[key] === "function") {
            fakeProxy[key] = initObj[key];
        }

        // For makeMemo
        else if (typeof initObj[key] === "object" && initObj[key][MEMO_SYMBOL]) {
            Object.defineProperty(fakeProxy, key, {
                get: () => {
                    return initObj[key].value;
                },
            });
        }

        // For makeState
        else if (typeof initObj[key] === "object" && initObj[key][STATE_SYMBOL]) {
            Object.defineProperty(fakeProxy, key, {
                get: () => {
                    return initObj[key].value;
                },
                set: (val) => {
                    initObj[key].value = val;
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
                    return initObj[key].get();
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
                    return initObj[key].get();
                },
                set: (val) => {
                    initObj[key].set(val);
                },
            });
        } else {
            let storage;
            let valueBeforeGet = initObj[key];
            Object.defineProperty(fakeProxy, key, {
                get: () => {
                    if (!storage) {
                        storage = new Signal.State(
                            isDeep
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
