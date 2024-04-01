import { Signal } from "signal-polyfill";

/**
 * Usage:
 * ```js
 * export class Counter {
 *    @signal accessor #value = 0;
 *
 *     get doubled() {
 *       return this.#value * 2;
 *     }
 *
 *     increment() {
  *      this.#value++;
   *   }
*
 *     decrement() {
  *      if (this.#value > 0) {
   *       this.#value--;
    *    }
     * }
  *  }
 * ```
 */ 
export function signal(target: object, _context: any) {
  const { get } = target;

  return {
    get() {
      return get.call(this).get();
    },

    set(value) {
      get.call(this).set(value);
    },
    
    init(value) {
      return new Signal.State(value);
    },
  };
}
