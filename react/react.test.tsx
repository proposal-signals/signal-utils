import "@testing-library/jest-dom/vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import React, { useCallback } from "react";
import { Signal } from "signal-polyfill";
import { afterEach, describe, expect, it } from "vitest";
import { track } from "./track";
import { useSignalState } from "./useSignalState";
import { useSignalValue } from "./useSignalValue";

// runs a clean after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup();
});

describe("track", () => {
  it("untracked components do not update", async () => {
    const signal = new Signal.State(0);
    const App = () => <div>count: {signal.get()}</div>;
    render(<App />);

    expect(screen.getByText("count: 0")).toBeInTheDocument();

    // it does not re-render when the signal is updated
    signal.set(1);
    await 0;

    expect(screen.getByText("count: 0")).toBeInTheDocument();
  });

  it("tracked components do update", async () => {
    const signal = new Signal.State(0);
    const App = track(() => {
      return <div>count: {signal.get()}</div>;
    });
    render(<App />);

    expect(screen.getByText("count: 0")).toBeInTheDocument();

    // it does not re-render when the signal is updated
    await act(() => {
      signal.set(1);
    });

    expect(screen.getByText("count: 1")).toBeInTheDocument();
  });

  it("allows tracked components to use hooks", async () => {
    const signal = new Signal.State(0);
    let setState;
    const App = track(() => {
      const [state, _setState] = React.useState("a");
      setState = _setState;
      return (
        <div>
          count: {state}
          {signal.get()}
        </div>
      );
    });
    render(<App />);

    expect(screen.getByText("count: a0")).toBeInTheDocument();

    await act(() => {
      signal.set(1);
    });

    expect(screen.getByText("count: a1")).toBeInTheDocument();

    await act(() => {
      setState("b");
    });

    expect(screen.getByText("count: b1")).toBeInTheDocument();
  });
});

describe("useSignalState", () => {
  it("creates a reactive value", async () => {
    const App = track(() => {
      const signal = useSignalState(0);
      const increment = useCallback(() => {
        signal.set(signal.get() + 1);
      }, [signal]);
      return <button onClick={increment}>count: {signal.get()}</button>;
    });

    render(<App />);
    expect(screen.getByText("count: 0")).toBeInTheDocument();

    await act(async () => {
      screen.getByRole("button").click();
    });

    expect(screen.getByText("count: 1")).toBeInTheDocument();

    await act(async () => {
      screen.getByRole("button").click();
    });

    expect(screen.getByText("count: 2")).toBeInTheDocument();
  });
});

describe("useSignalValue", () => {
  it("allows subscribing to signals individually outside of a tracked component", async () => {
    const signal = new Signal.State(0);
    let setState;
    const App = () => {
      const value = useSignalValue(signal);
      const [state, _setState] = React.useState(value);
      return <div>count: {value}</div>;
    };
    render(<App />);
    expect(screen.getByText("count: 0")).toBeInTheDocument();

    await act(() => {
      signal.set(1);
    });
    expect(screen.getByText("count: 1")).toBeInTheDocument();

    await act(() => {
      signal.set(2);
    });

    expect(screen.getByText("count: 2")).toBeInTheDocument();
  });

  it("allows using normal hooks too", async () => {
    const signal = new Signal.State(0);
    let setState;
    const App = () => {
      const value = useSignalValue(signal);
      const [state, _setState] = React.useState("a");
      setState = _setState;
      return (
        <div>
          count: {state}
          {value}
        </div>
      );
    };
    render(<App />);
    expect(screen.getByText("count: a0")).toBeInTheDocument();

    await act(() => {
      signal.set(1);
    });
    expect(screen.getByText("count: a1")).toBeInTheDocument();

    await act(() => {
      signal.set(2);
    });

    expect(screen.getByText("count: a2")).toBeInTheDocument();

    await act(() => {
      setState("b");
    });

    expect(screen.getByText("count: b2")).toBeInTheDocument();

    await act(() => {
      setState("c");
      signal.set(3);
    });

    expect(screen.getByText("count: c3")).toBeInTheDocument();
  });
});
