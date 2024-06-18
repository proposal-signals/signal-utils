import React from "react";
import { Signal } from "signal-polyfill";

// subtle, render should be stable
function useSignalTracking<T>(render: () => T): T {
  // This hook creates an watcher that will trigger re-renders when any signals ready during the passed render function update

  // We need the render fn to always be up-to-date when calling computed.get() but it'd be wasteful to
  // instantiate a new Computed on every render, so we use an immediately-updated ref
  // to wrap it
  const renderRef = React.useRef(render);
  renderRef.current = render;

  const [computedRender] = React.useState(
    () =>
      new Signal.Computed(() => {
        return renderRef.current();
      })
  );

  const [watcher, subscribe, getSnapshot] = React.useMemo(() => {
    let scheduleUpdate = null as null | (() => void);
    // useSyncExternalStore requires a subscribe function that returns an unsubscribe function
    const subscribe = (cb: () => void) => {
      scheduleUpdate = cb;
      return () => {
        scheduleUpdate = null;
      };
    };

    let numSchedules = 0;
    const watcher = new Signal.subtle.Watcher(async () => {
      await 0;
      if (computedRender.isPending()) {
        numSchedules++;
        scheduleUpdate?.();
        watcher.watch()
      }
    });

    // we use an incrementing number based on when this
    const getSnapshot = () => numSchedules;

    return [watcher, subscribe, getSnapshot];
  }, [name]);

  React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  // reactive dependencies are captured when `computed.get()` is called
  // and then to make it reactive we wait for a `useEffect` to 'attach'
  // this allows us to avoid rendering outside of React's render phase
  // and avoid 'zombie' components that try to render with bad/deleted data before
  // react has a chance to umount them.
  React.useEffect(() => {
    watcher.watch(computedRender);
    return () => {
      watcher.unwatch(computedRender);
    };
  }, [watcher]);

  return computedRender.get(true);
}

export const ProxyHandlers = {
  /**
   * This is a function call trap for functional components. When this is called, we know it means
   * React did run 'Component()', that means we can use any hooks here to setup our effect and
   * store.
   *
   * With the native Proxy, all other calls such as access/setting to/of properties will be
   * forwarded to the target Component, so we don't need to copy the Component's own or inherited
   * properties.
   *
   * @see https://github.com/facebook/react/blob/2d80a0cd690bb5650b6c8a6c079a87b5dc42bd15/packages/react-reconciler/src/ReactFiberHooks.old.js#L460
   */
  apply(Component: React.FunctionComponent, thisArg: any, argumentsList: any) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useSignalTracking(() => Component.apply(thisArg, argumentsList));
  },
};

export const ReactMemoSymbol = Symbol.for("react.memo");
export const ReactForwardRefSymbol = Symbol.for("react.forward_ref");

/**
 * Returns a tracked version of the given component.
 * Any signals whose values are read while the component renders will be tracked.
 * If any of the tracked signals change later it will cause the component to re-render.
 *
 * This also wraps the component in a React.memo() call, so it will only re-render if the props change.
 *
 * @example
 * ```ts
 * const Counter = track(function Counter(props: CounterProps) {
 *   const count = useSignalState(0)
 *   const increment = useCallback(() => count.set(count.get() + 1), [count])
 *   return <button onClick={increment}>{count.get()}</button>
 * })
 * ```
 *
 * @param baseComponent - The base component to track.
 * @public
 */
export function track<T extends React.FunctionComponent<any>>(
  baseComponent: T
): T extends React.MemoExoticComponent<any> ? T : React.MemoExoticComponent<T> {
  let compare = undefined;
  const $$typeof = baseComponent["$$typeof" as keyof typeof baseComponent];
  if ($$typeof === ReactMemoSymbol) {
    baseComponent = (baseComponent as any).type;
    compare = (baseComponent as any).compare;
  }
  if ($$typeof === ReactForwardRefSymbol) {
    return React.memo(
      React.forwardRef(
        new Proxy((baseComponent as any).render, ProxyHandlers) as any
      )
    ) as any;
  }

  return React.memo(
    new Proxy(baseComponent, ProxyHandlers) as any,
    compare
  ) as any;
}
