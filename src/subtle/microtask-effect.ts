import { Signal } from "signal-polyfill";

// NOTE: this implementation *LEAKS*
//       because there is nothing to unwatch a computed.

let pending = false;

let watcher = new Signal.subtle.Watcher(() => {
  if (!pending) {
    pending = true;
    queueMicrotask(() => {
      pending = false;
      flushPending();
    });
  }
});

function flushPending() {
  for (const signal of watcher.getPending()) {
    signal.get();
    // Keep watching... we don't know when we're allowed to stop watching
    watcher.watch(signal);
  }
}

/**
 * ⚠️ WARNING: Nothing unwatches ⚠️
 * This will produce a memory leak.
 */
export function effect(cb: () => void) {
  let c = new Signal.Computed(() => cb());

  watcher.watch(c);

  c.get();

  // We don't have anything to run this unwatch
  // because we don't have the concept
  // of an owner/container/lifetime.
  //
  // We also *can't* really have a lifetime concept
  // without encroaching on the goals of Starbeam.
  // (Or a full-fledged framework)
  //
  // (Starbeam is universal rectivity,
  //   solving timing and lifetime semantics across frameworks)
  // return () => watcher.unwatch(c);
}
