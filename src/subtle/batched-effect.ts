import { Signal } from "signal-polyfill";

const notifiedEffects = new Set<{
  computed: Signal.Computed<void>;
  watcher: Signal.subtle.Watcher;
}>();

/**
 * Runs a function inside a batch, and calls all the effected batched effects
 * synchronously.
 */
export const batch = (fn: () => void) => {
  // Run the function to notifiy the sync watchers
  fn();

  // Copy then clear the notified effects
  const effects = [...notifiedEffects];
  notifiedEffects.clear();

  // Run all the sync callbacks and re-enable the watchers
  effects.forEach(({ computed, watcher }) => {
    watcher.watch(computed);
    computed.get();
  });
};

/**
 * Creates an effect that runs synchronously inside a batch, when changes are
 * contained within a batch() call.
 */
export const batchedEffect = (effectFn: () => void) => {
  const computed = new Signal.Computed(effectFn);
  const watcher = new Signal.subtle.Watcher(async () => {
    // Synchonously add the effect to the notified effects
    notifiedEffects.add(entry);

    // Check if our effect is still in the notified effects
    await 0;

    if (notifiedEffects.has(entry)) {
      // If it is, then we call it async and remove it
      notifiedEffects.delete(entry);
      computed.get();
    }
  });
  const entry = { computed, watcher };
  watcher.watch(computed);
  computed.get();
};
