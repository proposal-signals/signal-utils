/* eslint-disable prefer-rest-params */
import { useMemo, useRef, useSyncExternalStore } from "react";
import { Signal } from "signal-polyfill";

type Gettable<T> = { get(): T };

/**
 * Extracts the value from a signal and subscribes to it.
 *
 * Note that you do not need to use this hook if you are wrapping the component with [[track]]
 *
 * @public
 */
export function useSignalValue<Value>(value: Gettable<Value>): Value;
/** @public */
export function useSignalValue<Value>(fn: () => Value, deps: unknown[]): Value;
/** @public */
export function useSignalValue() {
  const args = arguments;
  // deps will be either the computed or the deps array
  const deps = args.length === 2 ? args[1] : [args[0]];

  const isInRender = useRef(true);
  isInRender.current = true;

  const $val = useMemo(() => {
    if (args.length === 1) {
      return args[0];
    }
    return new Signal.Computed(() => {
      if (isInRender.current) {
        return args[0]();
      } else {
        try {
          return args[0]();
        } catch {
          // when getSnapshot is called outside of the render phase &
          // subsequently throws an error, it might be because we're
          // in a zombie-child state. in that case, we suppress the
          // error and instead return a new dummy value to trigger a
          // react re-render. if we were in a zombie child, react will
          // unmount us instead of re-rendering so the error is
          // irrelevant. if we're not in a zombie-child, react will
          // call `getSnapshot` again in the render phase, and the
          // error will be thrown as expected.
          return {};
        }
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  try {
    const { subscribe, getSnapshot } = useMemo(() => {
      let listen = () => {};
      const watcher = new Signal.subtle.Watcher(() => listen());
      return {
        subscribe: (_listen: () => void) => {
          listen = _listen;
          watcher.watch($val);
          return () => watcher.unwatch($val);
        },
        getSnapshot: () => {
          watcher.watch();
          return $val.get();
        },
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [$val]);

    return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  } finally {
    isInRender.current = false;
  }
}
