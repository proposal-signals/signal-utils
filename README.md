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
import { ReactiveArray } from 'signal-utils/array';

let arr = new ReactiveArray([1, 2, 3]);

// output: 3
// button clicked
// output: 2
<template>
  <output>{{arr.at(-1)}}</output>
  <button onclick={{() => arr.pop()}}>pop</button>
</template>
```

### `Object`

A reactive Object

```js
import { ReactiveObject } from 'signal-utils/object';

let obj = new ReactiveObject({
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

### `Map`

wip

A reactive Map

### `WeakMap`

wip

A reactive WeakMap

### `Set`

wip

A reactive Set

### `WeakSet`

wip

A reactive WeakSet

### `async`

wip

A reactive async function with pending/error state handling

### `localCopy` + `@localCopy`

wip

utilities for the [localCopy](https://github.com/tracked-tools/tracked-toolbox?tab=readme-ov-file#localcopy) pattern

### `dedupe` + `@dedupe`

wip

utilities for the [dedupe](https://github.com/tracked-tools/tracked-toolbox?tab=readme-ov-file#dedupetracked) pattern.


## Contributing

**Starting dev**

```bash
pnpm install
pnpm start
```

This will start a [concurrently](https://www.npmjs.com/package/concurrently) command that runs the vite build and vitest tests in parallel.

Vitest isn't being used _within_ the package, because we want to exercise the public API, generated types, etc (through package.json#exports and all that).
