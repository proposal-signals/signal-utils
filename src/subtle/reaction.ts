import { Signal } from "signal-polyfill";

/**
 * Reactions are a way to observe a value and run an effect when it changes.
 *
 * The `data` function is run and tracked in a computed signal. It returns a
 * value that is compared to the previous value. If the value changes, the
 * `effect` function is called with the new value and the previous value.
 *
 * @param data A function that returns the value to observe.
 * @param effect A function that is called when the value changes.
 * @param equals A function that compares two values for equality.
 * @returns A function that stops the reaction.
 */
export const reaction = <T>(
  data: () => T,
  effect: (value: T, previousValue: T) => void,
  equals = Object.is
) => {
  // Passing equals here doesn't seem to dedupe the effect calls.
  const computed: Signal.Computed<T> | undefined = new Signal.Computed(data, {
    equals,
  });
  let previousValue = computed.get();
  let notify: (() => Promise<void>) | undefined = async () => {
    await 0;
    // Check if this reaction was unsubscribed
    if (notify === undefined) {
      return;
    }
    const value = computed.get();
    if (!equals(value, previousValue)) {
      try {
        effect(value, previousValue);
      } catch (e) {
        // TODO: we actually want this to be unhandled, but Vitest complains.
        // We probably don't want to enable dangerouslyIgnoreUnhandledErrors
        // for all tests
        console.error(e);
      } finally {
        previousValue = value;
      }
    }
    watcher.watch();
  };
  const watcher = new Signal.subtle.Watcher(() => notify?.());
  watcher.watch(computed);
  return () => {
    watcher.unwatch();
    // TODO: Do we need this? Add a memory leak test.
    // By severing the reference to the notify function, we allow the garbage
    // collector to clean up the resources used by the watcher.
    notify = undefined;
  };
};
