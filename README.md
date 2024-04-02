# signal-utils

Utils for the [Signal's Proposal](https://github.com/proposal-signals/proposal-signals).

## APIs 

> [!NOTE]
> All examples either use JavaScript or a mixed-language psuedocode[^syntax-based-off] to convey the reactive intention of using Signals. 
> These utilities can be used in any framework that wires up Signals to their rendering implementation.

[^syntax-based-off]: The syntax is based of a mix of [Glimmer-flavored Javascript](https://tutorial.glimdown.com) and [Svelte](https://svelte.dev/). The main thing being focused around JavaScript without having a custom file format. The `<template>...</template>` blocks may as well be HTML, and `{{ }}` escapes out to JS. I don't have a strong preference on `{{ }}` vs `{ }`, the important thing is only to be consistent within an ecosystem.

### `@signal`

A utility decorator for easily creating signals 

```jsx
import { signal } from 'signal-utils';

class State {
    @signal accessor #value = 3;

    get doubled() {
        return this.#value * 2;
    }

    increment = () => this.#value++;
}

let state = new State();


// output: 6
// button clicked
// output: 8
<template>
  <output>{{state.doubled}}</output>
  <button onclick={{state.increment}}>+</button>
</template>
```

### `Array`

A reactive Array

```jsx
import { SignalArray } from 'signal-utils/array';

let arr = new SignalArray([1, 2, 3]);

// output: 3
// button clicked
// output: 2
<template>
  <output>{{arr.at(-1)}}</output>
  <button onclick={{() => arr.pop()}}>pop</button>
</template>
```

Inspo:
- [`TrackedArray`](https://github.com/tracked-tools/tracked-built-ins/blob/25f886d3d60ea3876f3ceaf31756e9f06eda49d7/addon/src/-private/array.ts#L1) from `tracked-built-ins` 

### `Object`

A reactive Object

```js
import { SignalObject } from 'signal-utils/object';

let obj = new SignalObject({
    isLoading: true,
    error: null,
    result: null,
});

// output: true
// button clicked
// output: false
<template>
  <output>{{obj.isLoading}}</output>
  <button onclick={{() => obj.isLoading = false}}>finish</button>
</template>
```

In this example, we could use a reactive object for quickly and dynamically creating an object of signals -- useful for when we don't know all the keys boforehand, or if we want a shorthand to creating many named signals.

Inspo:
- [`TrackedObject`](https://github.com/tracked-tools/tracked-built-ins/blob/master/addon/src/-private/object.js#L1) from `tracked-built-ins`

### `Map`

wip

A reactive Map

Inspo:
- [`TrackedMap`](https://github.com/tracked-tools/tracked-built-ins/blob/25f886d3d60ea3876f3ceaf31756e9f06eda49d7/addon/src/-private/map.ts#L8) from `tracked-built-ins`

### `WeakMap`

wip

A reactive WeakMap

Inspo:
- [`TrackedWeakMap`](https://github.com/tracked-tools/tracked-built-ins/blob/25f886d3d60ea3876f3ceaf31756e9f06eda49d7/addon/src/-private/map.ts#L134) from `tracked-built-ins`

### `Set`

wip

A reactive Set


Inspo:
- [`TrackedSet`](https://github.com/tracked-tools/tracked-built-ins/blob/25f886d3d60ea3876f3ceaf31756e9f06eda49d7/addon/src/-private/set.ts#L8) from `tracked-built-ins`

### `WeakSet`

wip

A reactive WeakSet

Inspo:
- [`TrackedWeakSet`](https://github.com/tracked-tools/tracked-built-ins/blob/25f886d3d60ea3876f3ceaf31756e9f06eda49d7/addon/src/-private/set.ts#L119) from `tracked-built-ins`

### `async`

wip

A reactive async function with pending/error state handling

Inspo:
- [`trackedFunction`](https://github.com/universal-ember/reactiveweb/blob/ba40c8a4417ec8b76bfb37754262f2829c6f7b26/reactiveweb/src/function.ts#L1) from `reactiveweb` 

### `localCopy` + `@localCopy`

wip

utilities for the [localCopy](https://github.com/tracked-tools/tracked-toolbox?tab=readme-ov-file#localcopy) pattern

Inspo:
- [`@localCopy`](https://github.com/tracked-tools/tracked-toolbox/blob/master/tracked-toolbox/src/index.js#L28) from `tracked-toolbox`

### `dedupe` + `@dedupe`

wip

utilities for the [dedupe](https://github.com/tracked-tools/tracked-toolbox?tab=readme-ov-file#dedupetracked) pattern.

Inspo:
- [`@dedupeTracked`](https://github.com/tracked-tools/tracked-toolbox/blob/master/tracked-toolbox/src/index.js#L148) from `tracked-toolbox`

## Contributing

**Starting dev**

```bash
pnpm install
pnpm start
```

This will start a [concurrently](https://www.npmjs.com/package/concurrently) command that runs the vite build and vitest tests in parallel.

Vitest isn't being used _within_ the package, because we want to exercise the public API, generated types, etc (through package.json#exports and all that).
