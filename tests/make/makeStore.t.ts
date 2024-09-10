// Note from Evan: For some reason, my VSCode won't appropriately assess the return type on keys of store objects. For example, when the input store has a key of *count: number*, the returned store's key is typed *count: unknown*.
// Isn't an issue for the repo my orginazation is using to test this stuff.
import { describe, expect, it, fn, beforeEach } from "jest"; // Need import, or should I convert this file to vitest ?
import { makeState, makeMemo, makeStore } from "../../src/make/makeStore";
import type {State, Memo, Store } from "../../src/make/makeStore";
import { Signal } from "signal-polyfill";

describe("makeStore", () => {
    const signalConst = Signal.State;
    const signalIsState = Signal.State.isState;
    const computedConst = Signal.Computed;
    const computedIsComputed = Signal.Computed.isComputed;
    let watcher = new Signal.subtle.Watcher(() => {});

    function effect(cb: () => void): () => void {
        const c = new Signal.Computed(() => cb());
        watcher.watch(c);
        c.get();
        return () => {};
    }

    beforeEach(() => {
        watcher = new Signal.subtle.Watcher(() => {});
        (Signal.State as any) = fn(function (obj) {
            return new signalConst(obj);
        });

        (Signal.Computed as any) = fn(function (obj) {
            return new computedConst(obj as () => unknown);
        });
        Signal.Computed.isComputed = computedIsComputed;
        Signal.State.isState = signalIsState;
    });

    describe("getting/setting fields", () => {
        it("works in a single layer object", () => {
            const store = makeStore({ count: 0, text: "hello" });

            expect(store.count).toEqual(0);
            expect(store.text).toEqual("hello");
            store.count = 1;
            store.text = "world";

            expect(store.text).toEqual("world");
            expect(store.count).toEqual(1);
        });

        it("does not create signal for primitives until get", () => {
            const store = makeStore({ count: 0 });

            // expect(store.count).toEqual(0);
            expect((Signal.State as any).mock.calls.length).toEqual(0);
            store.count = 1;
            expect((Signal.State as any).mock.calls.length).toEqual(0);
            expect(store.count).toEqual(1);
            expect((Signal.State as any).mock.calls.length).toEqual(1);
        });

        it("enables reactivity for all fields a one layer object", () => {
            const store = makeStore({ count: 0, text: "hello" });
            expect((Signal.State as any).mock.calls.length).toEqual(0);

            let effectWrittenCount;
            let effectWrittenText;
            effect(() => {
                effectWrittenCount = store.count;
            });
            effect(() => {
                effectWrittenText = store.text;
            });
            expect((Signal.State as any).mock.calls.length).toEqual(2);

            // Make sure watcher gets the notification
            expect(watcher.getPending().length).toEqual(0);
            store.count++;
            expect(watcher.getPending().length).toEqual(1);
            store.text = "world";
            expect(watcher.getPending().length).toEqual(2);

            // flush the watcher to pull the new results
            expect(effectWrittenCount).toEqual(0);
            expect(effectWrittenText).toEqual("hello");
            watcher.getPending().forEach((pending) => pending.get());
            expect(effectWrittenCount).toEqual(1);
            expect(effectWrittenText).toEqual("world");
        });

        it("enables reactivity for all fields a two layer object with deep flag true", () => {
            const store = makeStore(
                { level2: { count: 0, text: "hello" } },
                true,
            );

            expect((Signal.State as any).mock.calls.length).toEqual(0);

            let effectWrittenCount;
            let effectWrittenText;
            effect(() => {
                effectWrittenCount = store.level2.count;
            });
            effect(() => {
                effectWrittenText = store.level2.text;
            });
            expect((Signal.State as any).mock.calls.length).toEqual(3);

            // Make sure watcher gets the notification
            expect(watcher.getPending().length).toEqual(0);
            store.level2.count++;
            expect(watcher.getPending().length).toEqual(1);
            store.level2.text = "world";
            expect(watcher.getPending().length).toEqual(2);

            // flush the watcher to pull the new results
            expect(effectWrittenCount).toEqual(0);
            expect(effectWrittenText).toEqual("hello");
            watcher.getPending().forEach((pending) => pending.get());
            expect(effectWrittenCount).toEqual(1);
            expect(effectWrittenText).toEqual("world");
        });

        it("enables reactivity for all fields a two layer object using nested createStore call", () => {
            const store = makeStore({
                level2: makeStore({ count: 0, text: "hello" }),
            });

            expect((Signal.State as any).mock.calls.length).toEqual(0);

            let effectWrittenCount;
            let effectWrittenText;
            effect(() => {
                effectWrittenCount = store.level2.count;
            });
            effect(() => {
                effectWrittenText = store.level2.text;
            });
            expect((Signal.State as any).mock.calls.length).toEqual(3);

            // Make sure watcher gets the notification
            expect(watcher.getPending().length).toEqual(0);
            store.level2.count++;
            expect(watcher.getPending().length).toEqual(1);
            store.level2.text = "world";
            expect(watcher.getPending().length).toEqual(2);

            // flush the watcher to pull the new results
            expect(effectWrittenCount).toEqual(0);
            expect(effectWrittenText).toEqual("hello");
            watcher.getPending().forEach((pending) => pending.get());
            expect(effectWrittenCount).toEqual(1);
            expect(effectWrittenText).toEqual("world");
        });

        it("enables reactivity on intermediate signals", () => {
            const store = makeStore(
                { level2: { count: 0, text: "hello" } },
                true,
            );
            let effectWrittenLevel2 = store.level2;
            const originalLevel2 = store.level2;
            effect(() => {
                effectWrittenLevel2 = store.level2;
            });

            expect(watcher.getPending().length).toEqual(0);
            store.level2 = { count: -1, text: "" };
            expect(watcher.getPending().length).toEqual(1);

            expect(effectWrittenLevel2 === originalLevel2).toEqual(true);
            watcher.getPending().forEach((pending) => pending.get());
            expect(effectWrittenLevel2 === originalLevel2).toEqual(false);
        });

        it("doesn't disturb intermediate signals on leaf set", () => {
            const store = makeStore(
                { level2: { count: 0, text: "hello" } },
                true,
            );
            let effectWrittenCount;
            let effectWrittenLevel2 = store.level2;
            const originalLevel2 = store.level2;
            effect(() => {
                effectWrittenLevel2 = store.level2;
            });

            effect(() => {
                effectWrittenCount = store.level2.count;
            });

            expect(watcher.getPending().length).toEqual(0);
            store.level2.count++;
            expect(watcher.getPending().length).toEqual(1);

            expect(effectWrittenLevel2 === originalLevel2).toEqual(true);
            watcher.getPending().forEach((pending) => pending.get());
            expect(effectWrittenLevel2 === originalLevel2).toEqual(true);
            expect(effectWrittenCount).toEqual(1);
        });

        it("`.` syntax keeps reactivity on leaf nodes on intermediate updates", () => {
            const store = makeStore(
                { level2: { count: 0, text: "hello" } },
                true,
            );
            expect((Signal.State as any).mock.calls.length).toEqual(0);

            let effectWrittenCount;
            let effectWrittenLevel2 = store.level2;
            const originalLevel2 = store.level2;
            effect(() => {
                effectWrittenLevel2 = store.level2;
            });

            effect(() => {
                effectWrittenCount = store.level2.count;
            });

            // one for level2 and one for count
            expect((Signal.State as any).mock.calls.length).toEqual(2);

            expect(watcher.getPending().length).toEqual(0);
            store.level2 = { count: 0, text: "" };
            expect(watcher.getPending().length).toEqual(2);

            expect(effectWrittenLevel2 === originalLevel2).toEqual(true);
            watcher.getPending().forEach((pending) => pending.get());
            expect((Signal.State as any).mock.calls.length).toEqual(3); // one more for the new count
            expect(effectWrittenLevel2 === originalLevel2).toEqual(false);
            expect(effectWrittenCount).toEqual(0);
            watcher.watch();

            store.level2.count++;
            expect(watcher.getPending().length).toEqual(1);
            watcher.getPending().forEach((pending) => pending.get());
            expect(effectWrittenCount).toEqual(1);
        });

        it("does't do anything for primitives", () => {
            const store = makeStore(0);
            expect((Signal.State as any).mock.calls.length).toEqual(0);

            expect(store).toEqual(0);
            expect((Signal.State as any).mock.calls.length).toEqual(0);
        });
    });

    describe("functions", () => {
        it("rolls over getters into the new object", () => {
            const store = makeStore({
                count: 1,
                multiplier: 2,
                get multiplied() {
                    return store.count * store.multiplier;
                },
            });

            // Computed are also lazy creation
            expect((Signal.Computed as any).mock.calls.length).toEqual(0);
            expect((Signal.State as any).mock.calls.length).toEqual(0);

            const descriptor = Object.getOwnPropertyDescriptor(
                store,
                "multiplied",
            );
            expect(descriptor.get !== undefined).toBe(true);
            expect(descriptor.set === undefined).toBe(true);

            expect(store.multiplied).toEqual(2);

            expect((Signal.Computed as any).mock.calls.length).toEqual(0);
            expect((Signal.State as any).mock.calls.length).toEqual(2);
        });

        it("simply brings over other functions", () => {
            const store = makeStore({
                count: 1,
                increment() {
                    store.count++;
                },
            });

            expect((Signal.Computed as any).mock.calls.length).toEqual(0);
            expect((Signal.State as any).mock.calls.length).toEqual(0);

            const descriptor = Object.getOwnPropertyDescriptor(
                store,
                "increment",
            );
            expect(descriptor.get === undefined).toBe(true);
            expect(descriptor.set === undefined).toBe(true);
            expect(typeof store.increment).toBe("function");

            store.increment();

            expect(store.count).toBe(2);
        });

        it("creates a get for passed in Computeds", () => {
            const store = makeStore({
                count: 1,
                multiplier: 2,
                multiplied: makeMemo(() => store.count * store.multiplier),
            });

            expect((Signal.Computed as any).mock.calls.length).toEqual(1);
            expect((Signal.State as any).mock.calls.length).toEqual(0);

            const descriptor = Object.getOwnPropertyDescriptor(
                store,
                "multiplied",
            );
            expect(descriptor.get !== undefined).toBe(true);
            expect(descriptor.set === undefined).toBe(true);

            expect(store.multiplied).toEqual(2);

            // The computed finally triggered the signals to get created
            expect((Signal.Computed as any).mock.calls.length).toEqual(1);
            expect((Signal.State as any).mock.calls.length).toEqual(2);
        });

        it("creates a get and set passed in Signals", () => {
            const store = makeStore({
                count: new Signal.State(1),
            });

            expect((Signal.State as any).mock.calls.length).toEqual(1);

            const descriptor = Object.getOwnPropertyDescriptor(store, "count");
            expect(descriptor.get !== undefined).toBe(true);
            expect(descriptor.set !== undefined).toBe(true);

            expect(store.count).toEqual(1);
            store.count++;
            expect(store.count).toEqual(2);

            expect((Signal.State as any).mock.calls.length).toEqual(1);
        });

        it("appropriately handles signal keys created via makeState", () => {
            const store = makeStore({
                count: makeState(1),
                multiplier: 2,
                squareIt: makeMemo(() => store.count ** 2),
            });

            const descriptor = Object.getOwnPropertyDescriptor(store, "count");
            expect(descriptor.get !== undefined).toBe(true);
            expect(descriptor.set !== undefined).toBe(true);
            expect(store.count).toEqual(1);
            store.count++;
            expect(store.count).toEqual(2);
            expect(store.squareIt).toEqual(4);
        });

        it("creates computeds", () => {
            const store = makeStore({
                count: 1,
                multiplier: 2,
                addOne: makeMemo(() => store.count + 1),
                addTwo: makeMemo(() => store.count + 2),
                squareIt: makeMemo(() => store.count ** 2),
                multiplied: makeMemo(() => store.count * store.multiplier),
            });

            expect((Signal.Computed as any).mock.calls.length).toEqual(4);

            const descriptor = Object.getOwnPropertyDescriptor(store, "addOne");
            expect(descriptor.get == undefined).toBe(false);
            expect(descriptor.set == undefined).toBe(true);

            expect(store.count).toEqual(1);
            expect(store.squareIt).toEqual(1);
            store.count++;
            expect(store.count).toEqual(2);
            expect(store.squareIt).toEqual(4);
            expect(store.multiplied).toEqual(4);
        });

        it("correctly responds to actions defined as callbacks", () => {
            const store = makeStore({
                count: 1,
                multiplier: 2,
                multiplied: makeMemo(() => store.count * store.multiplier),
                increment: () => store.count++,
            });

            expect(store.count).toEqual(1);
            expect(store.multiplier).toEqual(2);
            expect(store.multiplied).toEqual(2);
            store.increment();
            expect(store.count).toEqual(2);
            expect(store.multiplied).toEqual(4);
        });
    });

    describe("makeState", () => {
        it("correctly creates basic Signal interface", () => {
            const numSignal = makeState(0);
            expect(numSignal.value).toEqual(0);
            numSignal.value++;
            numSignal.value++;
            expect(numSignal.value).toEqual(2);
        });
    });

    describe("makeMemo", () => {
        it("correctly creates basic Computed interface", () => {
            const numSignal = makeState(0);
            const numSquaredMemo = makeMemo(
                () => numSignal.value * numSignal.value,
            );
            expect(numSquaredMemo.value).toEqual(0);
            numSignal.value = 3;
            expect(numSquaredMemo.value).toEqual(9);
        });
    });
});
