import { Signal } from "signal-polyfill";

/**
 * Usage:
 * ```js
 * export class Counter {
 *   @signal accessor #value = 0;
 *
 *   get doubled() {
 *     return this.#value * 2;
 *   }
 *
 *   increment() {
 *     this.#value++;
 *   }
 *
 *   decrement() {
 *     if (this.#value > 0) {
 *       this.#value--;
 *     }
 *   }
 * }
 * ```
 */
export function signal<Value = any>(
  target: ClassAccessorDecoratorTarget<unknown, Value>,
  _context: ClassAccessorDecoratorContext,
): ClassAccessorDecoratorResult<unknown, Value> {
  const { get } = target;

  return {
    get(): Value {
      // SAFETY: does TS not allow us to have a different type internally?
      //         maybe I did something goofy.
      return (get.call(this) as Signal.State<Value>).get();
    },

    set(value: Value) {
      // SAFETY: does TS not allow us to have a different type internally?
      //         maybe I did something goofy.
      (get.call(this) as Signal.State<Value>).set(value);
    },

    init(value: Value) {
      // SAFETY: does TS not allow us to have a different type internally?
      //         maybe I did something goofy.
      return new Signal.State(value) as unknown as Value;
    },
  };
}
