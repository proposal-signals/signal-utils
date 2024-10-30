import { Signal } from "signal-polyfill";

/**
 * Define the options to pass to the underling Signal 
 */
export function signal<Value = any>(
  options: Signal.Options<Value>,
): typeof stateDecorator<Value>;

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
  ...args: Parameters<typeof stateDecorator<Value>>
): ReturnType<typeof stateDecorator<Value>>;

/**
 * Usage:
 * ```js
 * import { signal } from 'signal-utils';
 *
 * export class Counter {
 *   @signal accessor #value = 0;
 *
 *   @signal
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
export function signal<Value = any>(
  ...args: Parameters<typeof computedDecorator<Value>>
): ReturnType<typeof computedDecorator<Value>>;

export function signal<Value = any>(
  ...args:
    | [Signal.Options<Value>]
    | Parameters<typeof stateDecorator<Value>>
    | Parameters<typeof computedDecorator<Value>>
) {
  // Options
  if (args.length === 1) {
    return optionsBuilder(args[0]);
  }

  if (args[2].kind === "accessor") {
    return stateDecorator(
      ...(args as Parameters<typeof stateDecorator<Value>>),
    );
  }

  if (args[2].kind === "getter") {
    return computedDecorator(
      ...(args as Parameters<typeof computedDecorator<Value>>),
    );
  }

  throw new Error(`@signal can only be used on accessors or getters`);
}

function optionsBuilder<Value = any>(options: Signal.Options<Value> = {}) {

  return (...args: StateArgs<Value> | ComputedArgs<Value>) => {
    if (args[1].kind === "accessor") {
      return signal(options, args[0], args[1]);
    }

    if (args[1].kind === "getter") {
      return signal(options, args[0], args[1]);
    }

    throw new Error(`@signal can only be used on accessors or getters`);
  }
}

type FullStateArgs<Value> = Parameters<typeof stateDecorator<Value>>
type FullComputedArgs<Value> = Parameters<typeof computedDecorator<Value>>
type StateArgs<Value> = [FullStateArgs<Value>[1], FullStateArgs<Value>[2]];
type ComputedArgs<Value> = [FullComputedArgs<Value>[1], FullComputedArgs<Value>[2]];

function stateDecorator<Value = any>(
  options: Signal.Options<Value> = {},
  target: ClassAccessorDecoratorTarget<unknown, Value>,
  context: ClassAccessorDecoratorContext,
): ClassAccessorDecoratorResult<unknown, Value> {
  const { get } = target;

  if (context.kind !== "accessor") {
    throw new Error(`Expected to be used on an accessor property`);
  }

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
      return new Signal.State(value, options) as unknown as Value;
    },
  };
}

function computedDecorator<Value = any>(
  options: Signal.Options<Value> = {},
  target: () => Value,
  context: ClassGetterDecoratorContext,
): () => Value {
  const kind = context.kind;

  if (kind !== "getter") {
    throw new Error(`Can only use @cached on getters.`);
  }

  let caches = new WeakMap<typeof target, Signal.Computed<Value>>();

  return function(this: unknown) {
    let cache = caches.get(target);
    if (!cache) {
      cache = new Signal.Computed(() => target.call(this), options);
      caches.set(target, cache);
    }

    return cache.get();
  };
}
