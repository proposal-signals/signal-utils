import { useState } from "react";
import { Signal } from "signal-polyfill";

export function useSignalState<T>(
  initialValue: T | (() => T),
  opts?: Signal.Options<T>
) {
  const [signal] = useState(
    () =>
      new Signal.State(
        typeof initialValue === "function"
          ? (initialValue as () => T)()
          : initialValue,
        opts
      )
  );
  return signal;
}
