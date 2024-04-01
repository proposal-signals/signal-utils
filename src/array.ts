/* eslint-disable @typescript-eslint/no-explicit-any */
// Unfortunately, TypeScript's ability to do inference *or* type-checking in a
// `Proxy`'s body is very limited, so we have to use a number of casts `as any`
// to make the internal accesses work. The type safety of these is guaranteed at
// the *call site* instead of within the body: you cannot do `Array.blah` in TS,
// and it will blow up in JS in exactly the same way, so it is safe to assume
// that properties within the getter have the correct type in TS.

import { Signal } from "signal-polyfill";
import { createStorage } from "./-private/util.ts";

const ARRAY_GETTER_METHODS = new Set<string | symbol | number>([
  Symbol.iterator,
  "concat",
  "entries",
  "every",
  "filter",
  "find",
  "findIndex",
  "flat",
  "flatMap",
  "forEach",
  "includes",
  "indexOf",
  "join",
  "keys",
  "lastIndexOf",
  "map",
  "reduce",
  "reduceRight",
  "slice",
  "some",
  "values",
]);

// For these methods, `Array` itself immediately gets the `.length` to return
// after invoking them.
const ARRAY_WRITE_THEN_READ_METHODS = new Set<string | symbol>([
  "fill",
  "push",
  "unshift",
]);

function convertToInt(prop: number | string | symbol): number | null {
  if (typeof prop === "symbol") return null;

  const num = Number(prop);

  if (isNaN(num)) return null;

  return num % 1 === 0 ? num : null;
}

class ReactiveArrayImpl<T = unknown> {
  /**
   * Creates an array from an iterable object.
   * @param iterable An iterable object to convert to an array.
   */
  static from<T>(iterable: Iterable<T> | ArrayLike<T>): ReactiveArrayImpl<T>;

  /**
   * Creates an array from an iterable object.
   * @param iterable An iterable object to convert to an array.
   * @param mapfn A mapping function to call on every element of the array.
   * @param thisArg Value of 'this' used to invoke the mapfn.
   */
  static from<T, U>(
    iterable: Iterable<T> | ArrayLike<T>,
    mapfn: (v: T, k: number) => U,
    thisArg?: unknown,
  ): ReactiveArrayImpl<U>;

  static from<T, U>(
    iterable: Iterable<T> | ArrayLike<T>,
    mapfn?: (v: T, k: number) => U,
    thisArg?: unknown,
  ): ReactiveArrayImpl<T> | ReactiveArrayImpl<U> {
    return mapfn
      ? new ReactiveArrayImpl(Array.from(iterable, mapfn, thisArg))
      : new ReactiveArrayImpl(Array.from(iterable));
  }

  static of<T>(...arr: T[]): ReactiveArrayImpl<T> {
    return new ReactiveArrayImpl(arr);
  }

  constructor(arr: T[] = []) {
    let clone = arr.slice();
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let self = this;

    let boundFns = new Map<string | symbol, (...args: any[]) => any>();

    /**
      Flag to track whether we have *just* intercepted a call to `.push()` or
      `.unshift()`, since in those cases (and only those cases!) the `Array`
      itself checks `.length` to return from the function call.
     */
    let nativelyAccessingLengthFromPushOrUnshift = false;

    return new Proxy(clone, {
      get(target, prop /*, _receiver */) {
        let index = convertToInt(prop);

        if (index !== null) {
          self.#readStorageFor(index);
          self.#collection.get();

          return target[index];
        }

        if (prop === "length") {
          // If we are reading `.length`, it may be a normal user-triggered
          // read, or it may be a read triggered by Array itself. In the latter
          // case, it is because we have just done `.push()` or `.unshift()`; in
          // that case it is safe not to mark this as a *read* operation, since
          // calling `.push()` or `.unshift()` cannot otherwise be part of a
          // "read" operation safely, and if done during an *existing* read
          // (e.g. if the user has already checked `.length` *prior* to this),
          // that will still trigger the mutation-after-consumption assertion.
          if (nativelyAccessingLengthFromPushOrUnshift) {
            nativelyAccessingLengthFromPushOrUnshift = false;
          } else {
            self.#collection.get();
          }

          return target[prop];
        }

        // Here, track that we are doing a `.push()` or `.unshift()` by setting
        // the flag to `true` so that when the `.length` is read by `Array` (see
        // immediately above), it knows not to dirty the collection.
        if (ARRAY_WRITE_THEN_READ_METHODS.has(prop)) {
          nativelyAccessingLengthFromPushOrUnshift = true;
        }

        if (ARRAY_GETTER_METHODS.has(prop)) {
          let fn = boundFns.get(prop);

          if (fn === undefined) {
            fn = (...args) => {
              self.#collection.get();
              return (target as any)[prop](...args);
            };

            boundFns.set(prop, fn);
          }

          return fn;
        }

        return (target as any)[prop];
      },

      set(target, prop, value /*, _receiver */) {
        (target as any)[prop] = value;

        let index = convertToInt(prop);

        if (index !== null) {
          self.#dirtyStorageFor(index);
          self.#collection.set(null);
        } else if (prop === "length") {
          self.#collection.set(null);
        }

        return true;
      },

      getPrototypeOf() {
        return ReactiveArrayImpl.prototype;
      },
    }) as ReactiveArrayImpl<T>;
  }

  #collection = createStorage();

  #storages = new Map<PropertyKey, Signal.State<null>>();

  #readStorageFor(index: number) {
    let storage = this.#storages.get(index);

    if (storage === undefined) {
      storage = createStorage();
      this.#storages.set(index, storage);
    }

    storage.get();
  }

  #dirtyStorageFor(index: number): void {
    const storage = this.#storages.get(index);

    if (storage) {
      storage.set(null);
    }
  }
}

// This rule is correct in the general case, but it doesn't understand
// declaration merging, which is how we're using the interface here. This says
// `ReactiveArray` acts just like `Array<T>`, but also has the properties
// declared via the `class` declaration above -- but without the cost of a
// subclass, which is much slower that the proxied array behavior. That is: a
// `ReactiveArray` *is* an `Array`, just with a proxy in front of accessors and
// setters, rather than a subclass of an `Array` which would be de-optimized by
// the browsers.
//
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface ReactiveArrayImpl<T = unknown> extends Array<T> {}

type ReactiveArray = ReactiveArrayImpl;

export const ReactiveArray: ReactiveArray =
  ReactiveArrayImpl as unknown as ReactiveArray;

// Ensure instanceof works correctly
Object.setPrototypeOf(ReactiveArrayImpl.prototype, Array.prototype);
