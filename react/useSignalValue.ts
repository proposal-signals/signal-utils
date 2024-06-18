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
  const deps = args.length === 2 ? args[1] : [args[0]];

  const $val = useMemo(() => {
    return new Signal.Computed(() => {
      if (args.length === 1) {
        return args[0].get();
      }
      return args[0]();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const { subscribe, watcher, getSnapshot } = useMemo(() => {
    let listen = () => {};
    let numSchedules = 0;
    const watcher = new Signal.subtle.Watcher(async () => {
      await 0;
      if ($val.isPending()) {
        numSchedules++;
        listen();
        watcher.watch();
      }
    });
    return {
      subscribe: (_listen: () => void) => {
        listen = _listen;
        watcher.watch($val);
        return () => watcher.unwatch($val);
      },
      watcher,
      getSnapshot: () => {
        return numSchedules;
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [$val]);

  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return $val.get();
}
