import { Signal } from "signal-polyfill";
/**
 * Usage:
 * ```js
 * import { signal } from 'signal-utils';
 * import { cached } from 'signal-utils/cached';
 *
 * export class Counter {
 *   @signal accessor #value = 0;
 *
 *   @cached
 *   get expensive() {
 *     // some expensive operation
 *     return this.#value * 2;
 *   }
 *
 *   increment() {
 *     this.#value++;
 *   }
 * }
 * ```
 */
export function cached<Value = any>(
  target: () => Value,
  context: ClassGetterDecoratorContext,
): () => Value {
  const kind = context.kind;

  if (kind !== "getter") {
    throw new Error(`Can only use @cached on getters.`);
  }

  let caches = new WeakMap<typeof target, Signal.Computed<Value>>();

  return function (this: unknown) {
    let cache = caches.get(target);
    if (!cache) {
      cache = new Signal.Computed(() => target.call(this));
      caches.set(target, cache);
    }

    return cache.get();
  };
}
