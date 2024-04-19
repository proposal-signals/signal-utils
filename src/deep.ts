/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-types */

/**
 * TODO: decorators and TS are... fun
 *       this file needs a lot of work
 *
 */
import {
  dirtyCollection,
  fnCacheFor,
  hasStorage,
  initStorage,
  readCollection,
  readStorage,
  updateStorage,
} from './utils';
import { Signal } from "signal-polyfill";
import { createStorage } from "./-private/util.ts";

type DeepTrackedArgs<T> =
  | [T[]]
  | [Record<string, unknown>]
  | [object, string | symbol, PropertyDescriptor];

type PropertyList = Array<string | number | Symbol>;
type TrackedProxy<T> = T;

/**
 * Deeply track an Array, and all nested objects/arrays within.
 *
 * If an element / value is ever a non-object or non-array, deep-tracking will exit
 *
 */
export function tracked<T>(arr: T[]): TrackedProxy<T[]>;
/**
 * Deeply track an Object, and all nested objects/arrays within.
 *
 * If an element / value is ever a non-object or non-array, deep-tracking will exit
 *
 */
export function tracked<T extends Record<string, unknown>>(obj: T): TrackedProxy<T>;
/**
 * Deeply track an Object or Array, and all nested objects/arrays within.
 *
 * If an element / value is ever a non-object or non-array, deep-tracking will exit
 *
 */
export function tracked(...args: any): any;

export function tracked<T>(...[obj, key, desc]: DeepTrackedArgs<T>): unknown {
  if (key !== undefined && desc !== undefined) {
    return deepTrackedForDescriptor(obj, key, desc);
  }

  return deepTracked(obj);
}

function deepTrackedForDescriptor(_obj: object, key: string | symbol, desc: any): any {
  let initializer = desc.initializer;

  delete desc.initializer;
  delete desc.value;
  delete desc.writable;
  delete desc.configurable;

  desc.get = function get() {
    if (hasStorage(this, key)) {
      return readStorage(this, key);
    }

    return initStorage(this, key, deepTracked(initializer?.call(this)));
  };

  desc.set = function set(v: any) {
    updateStorage(this, key, deepTracked(v));
  };
}

const TARGET = Symbol('TARGET');
const IS_PROXIED = Symbol('IS_PROXIED');

const SECRET_PROPERTIES: PropertyList = [TARGET, IS_PROXIED];

const ARRAY_COLLECTION_PROPERTIES = ['length'];
const ARRAY_CONSUME_METHODS = [
  Symbol.iterator,
  'at',
  'concat',
  'entries',
  'every',
  'filter',
  'find',
  'findIndex',
  'findLast',
  'findLastIndex',
  'flat',
  'flatMap',
  'forEach',
  'group',
  'groupToMap',
  'includes',
  'indexOf',
  'join',
  'keys',
  'lastIndexOf',
  'map',
  'reduce',
  'reduceRight',
  'slice',
  'some',
  'toString',
  'values',
  'length',
];

const ARRAY_DIRTY_METHODS = [
  'sort',
  'fill',
  'pop',
  'push',
  'shift',
  'splice',
  'unshift',
  'reverse',
];

const ARRAY_QUERY_METHODS: PropertyList = ['indexOf', 'contains', 'lastIndexOf', 'includes'];

function deepTracked<T extends object>(obj?: T | undefined): T | undefined | null {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (obj[IS_PROXIED as keyof T]) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return deepProxy(obj, arrayProxyHandler) as unknown as T;
  }

  if (typeof obj === 'object') {
    return deepProxy(obj, objProxyHandler) as unknown as T;
  }

  return obj;
}

const arrayProxyHandler: ProxyHandler<Array<unknown>> = {
  get<T extends unknown[]>(target: T, property: keyof T, receiver: T) {
    let value = Reflect.get(target, property, receiver);

    if (property === TARGET) {
      return value;
    }

    if (property === IS_PROXIED) {
      return true;
    }

    if (typeof property === 'string') {
      let parsed = parseInt(property, 10);

      if (!isNaN(parsed)) {
        // Why consume the collection?
        // because indices can change if the collection changes
        readCollection(target);
        readStorage(target, parsed);

        return deepTracked(value);
      }

      if (ARRAY_COLLECTION_PROPERTIES.includes(property)) {
        readCollection(target);

        return value;
      }
    }

    if (typeof value === 'function') {
      let fnCache = fnCacheFor(target);
      let existing = fnCache.get(property);

      if (!existing) {
        let fn = (...args: unknown[]) => {
          if (typeof property === 'string') {
            if (ARRAY_QUERY_METHODS.includes(property)) {
              readCollection(target);

              let fn = target[property];

              if (typeof fn === 'function') {
                return fn.call(target, ...args.map(unwrap));
              }
            } else if (ARRAY_CONSUME_METHODS.includes(property)) {
              readCollection(target);
            } else if (ARRAY_DIRTY_METHODS.includes(property)) {
              dirtyCollection(target);
            }
          }

          return Reflect.apply(value, receiver, args);
        };

        fnCache.set(property, fn);

        return fn;
      }

      return existing;
    }

    return value;
  },
  set(target, property, value, receiver) {
    if (typeof property === 'string') {
      let parsed = parseInt(property, 10);

      if (!isNaN(parsed)) {
        updateStorage(target, property, value);
        // when setting, the collection must be dirtied.. :(
        // this is to support updating {{#each}},
        // which uses object identity by default
        dirtyCollection(target);

        return Reflect.set(target, property, value, receiver);
      } else if (property === 'length') {
        dirtyCollection(target);

        return Reflect.set(target, property, value, receiver);
      }
    }

    dirtyCollection(target);

    return Reflect.set(target, property, value, receiver);
  },
  has(target, property) {
    if (SECRET_PROPERTIES.includes(property)) {
      return true;
    }

    readStorage(target, property);

    return property in target;
  },
  getPrototypeOf() {
    return Array.prototype;
  },
};

const objProxyHandler = {
  get<T extends object>(target: T, prop: keyof T, receiver: T) {
    if (prop === TARGET) {
      return target;
    }

    if (prop === IS_PROXIED) {
      return true;
    }

    readStorage(target, prop);

    return deepTracked(Reflect.get(target, prop, receiver));
  },
  has<T extends object>(target: T, prop: keyof T) {
    if (SECRET_PROPERTIES.includes(prop)) {
      return true;
    }

    readStorage(target, prop);

    return prop in target;
  },

  ownKeys<T extends object>(target: T) {
    readCollection(target);

    return Reflect.ownKeys(target);
  },

  set<T extends object>(target: T, prop: keyof T, value: T[keyof T], receiver: T) {
    updateStorage(target, prop);
    dirtyCollection(target);

    return Reflect.set(target, prop, value, receiver);
  },

  getPrototypeOf() {
    return Object.prototype;
  },
};

const PROXY_CACHE = new WeakMap<any, object>();

function unwrap<T>(obj: T) {
  if (TARGET in obj) {
    return obj[TARGET as keyof T];
  }

  return obj;
}

function deepProxy<T extends object>(obj: T, handler: ProxyHandler<T>): TrackedProxy<T> {
  let existing = PROXY_CACHE.get(obj);

  if (existing) {
    return existing as T;
  }

  let proxied = new Proxy(obj, handler);

  PROXY_CACHE.set(obj, proxied);

  return proxied as T;
}
