# signal-utils

Utils for the [Signal's Proposal](https://github.com/proposal-signals/proposal-signals).

## APIs 

> [!NOTE]
> All examples either use JavaScript or a mixed-language psuedocode[^syntax-based-off] to convey the reactive intention of using Signals. 
> These utilities can be used in any framework that wires up Signals to their rendering implementation.

[^syntax-based-off]: The syntax is based of a mix of [Glimmer-flavored Javascript](https://tutorial.glimdown.com) and [Svelte](https://svelte.dev/). The main thing being focused around JavaScript without having a custom file format. The `<template>...</template>` blocks may as well be HTML, and `{{ }}` escapes out to JS. I don't have a strong preference on `{{ }}` vs `{ }`, the important thing is only to be consistent within an ecosystem.

- data structures
  - [Array](#array)
  - [Object](#object)
  - [Map](#map)
  - [Set](#Set)
  - [WeakMap](#weakmap)
  - [WeakSet](#weakset)
- general utilities
  - [Promise](#promise)
  - [async function](#async-function) 
- class utilities
  - [@signal](#%40signal)
  - [@cached](#$40cached)

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

### `@cached`

A utility decorator for caching getters in classes. Useful for caching expensive computations. 

```js
import { signal } from 'signal-utils';
import { cached } from 'signal-utils/cached';

class State {
    @signal accessor #value = 3;

    @cached
    get doubled() {
        // imagine an expensive operation
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

Note that the impact of maintaining a cache is often more expensive than re-deriving the data in the getter. Use sparingly, or to return non-primitive values and maintain referential integrity between repeat accesses.

### `Array`

A reactive Array.
This API mimics the built-in APIs and behaviors of [Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array). 

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

Other ways of constructing an array:

```jsx
import { SignalArray, signalArray } from 'signal-utils/array';

SignalArray.from([1, 2, 3]);
signalArray([1, 2, 3]);
```

Note that [`.from`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/from) gives you more options of how to create your new array structure.

### `Object`

A reactive Object.
This API mimics the built-in APIs and behaviors of [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object).

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

Other ways of constructing an object:

```jsx
import { SignalObject, signalObject } from 'signal-utils/object';

SignalObject.fromEntries([ /* ... */ ]);
signalObject({ /* ... */ } );
```

Note that [`.fromEntries`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/fromEntries) gives you more options of how to create your new object structure.

### `Map`


A reactive Map

```js
import { SignalMap } from 'signal-utils/map';

let map = new SignalMap();

map.set('isLoading', true);

// output: true
// button clicked
// output: false
<template>
  <output>{{map.get('isLoading')}}</output>
  <button onclick={{() => map.set('isLoading', false)}}>finish</button>
</template>
```



### `WeakMap`

A reactive WeakMap

```js
import { SignalWeakMap } from 'signal-utils/weak-map';

let map = new SignalWeakMap();

let obj = { greeting: 'hello' };

map.set(obj, true);

// output: true
// button clicked
// output: false
<template>
  <output>{{map.get(obj)}}</output>
  <button onclick={{() => map.set(obj, false)}}>finish</button>
</template>
```



### `Set`

A reactive Set

```js
import { SignalSet } from 'signal-utils/set';

let set = new SignalSet();

set.add(123);

// output: true
// button clicked
// output: false
<template>
  <output>{{set.has(123)}}</output>
  <button onclick={{() => set.delete(123)}}>finish</button>
</template>
```


### `WeakSet`

A reactive WeakSet

```js
import { SignalWeakSet } from 'signal-utils/weak-set';

let set = new SignalWeakSet();

let obj = { greeting: 'hello' };

set.add(obj);

// output: true
// button clicked
// output: false
<template>
  <output>{{set.has(obj)}}</output>
  <button onclick={{() => set.delete(obj)}}>finish</button>
</template>
```


### `Promise`

A reactive Promise handler that gives your reactive properties for when the promise resolves or rejects.

```js
import { SignalAsyncData } from 'signal-utils/async-data';

const response = fetch('...');
const signalResponse = new SignalAsyncData(response);

// output: true
// after the fetch finishes
// output: false
<template>
  <output>{{signalResponse.isLoading}}</output>
</template>
```

There is also a `load` export which does the construction for you.

```js
import { load } from 'signal-utils/async-data';

const response = fetch('...');
const signalResponse = load(response);

// output: true
// after the fetch finishes
// output: false
<template>
  <output>{{signalResponse.isLoading}}</output>
</template>
```

the `signalResponse` object has familiar properties on it:
- `value`
- `error`
- `state`
- `isResolved`
- `isPending`
- `isRejected`


The important thing to note about using `load` / `SignalAsyncData`, is that you must already have a `PromiseLike`. For reactive-invocation of async functions, see the section below on `signalFunction`

### `async` `function`

A reactive async function with pending/error state handling

```js
import { Signal } from 'signal-polyfill';
import { signalFunction } from 'signal-utils/async-function';

const url = new Signal.State('...');
const signalResponse = signalFunction(async () => {
  const response = await fetch(url.get()); // entangles with `url`
  // after an away, you've detatched from the signal-auto-tracking
  return response.json(); 
});

// output: true
// after the fetch finishes
// output: false
<template>
  <output>{{signalResponse.isLoading}}</output>
</template>

```

the `signalResponse` object has familiar properties on it:
- `value`
- `error`
- `state`
- `isResolved`
- `isPending`
- `isRejected`
- `isError` (alias)
- `isSettled` (alias)
- `isLoading` (alias)
- `isFinished` (alias)
- `retry()`

### `localCopy` + `@localCopy`

wip

utilities for the [localCopy](https://github.com/tracked-tools/tracked-toolbox?tab=readme-ov-file#localcopy) pattern


### `dedupe` + `@dedupe`

wip

utilities for the [dedupe](https://github.com/tracked-tools/tracked-toolbox?tab=readme-ov-file#dedupetracked) pattern.

### Draft

wip

Forking a reactive tree and optionally sync it back to the original -- useful for forms / fields where you want to edit the state, but don't want to mutate the reactive root right away.

Inspo: https://github.com/chriskrycho/tracked-draft

## Contributing

**Starting dev**

```bash
pnpm install
pnpm start
```

This will start a [concurrently](https://www.npmjs.com/package/concurrently) command that runs the vite build and vitest tests in parallel.

Vitest isn't being used _within_ the package, because we want to exercise the public API, generated types, etc (through package.json#exports and all that).

## Is this bug free?

Likely not, code (and tests!) are copied from pre-existing implementations, and those implementations change over time. If you find a bug, please file an issue or open a PR, thanks!!

## Credits and Inspiration

This library could not have been developed so quickly without borrowing from existing libraries that already built these patterns. This library, signal-utils, is an adaptation and aggregation of utilities found throughout the community.


- `tracked-built-ins`
  - [`TrackedArray`](https://github.com/tracked-tools/tracked-built-ins/blob/25f886d3d60ea3876f3ceaf31756e9f06eda49d7/addon/src/-private/array.ts#L1)
  - [`TrackedObject`](https://github.com/tracked-tools/tracked-built-ins/blob/master/addon/src/-private/object.js#L1) 
  - [`TrackedMap`](https://github.com/tracked-tools/tracked-built-ins/blob/25f886d3d60ea3876f3ceaf31756e9f06eda49d7/addon/src/-private/map.ts#L8)
  - [`TrackedWeakMap`](https://github.com/tracked-tools/tracked-built-ins/blob/25f886d3d60ea3876f3ceaf31756e9f06eda49d7/addon/src/-private/map.ts#L134)
  - [`TrackedSet`](https://github.com/tracked-tools/tracked-built-ins/blob/25f886d3d60ea3876f3ceaf31756e9f06eda49d7/addon/src/-private/set.ts#L8)
  - [`TrackedWeakSet`](https://github.com/tracked-tools/tracked-built-ins/blob/25f886d3d60ea3876f3ceaf31756e9f06eda49d7/addon/src/-private/set.ts#L119) 
- `tracked-toolbox`
  - [`@dedupeTracked`](https://github.com/tracked-tools/tracked-toolbox/blob/master/tracked-toolbox/src/index.js#L148) 
  - [`@localCopy`](https://github.com/tracked-tools/tracked-toolbox/blob/master/tracked-toolbox/src/index.js#L28) 
- `ember-async-data`
  - [`TrackedAsyncData`](https://github.com/tracked-tools/ember-async-data/blob/1346f03c7fa677342408a9811916b916e3c4ad54/ember-async-data/src/tracked-async-data.ts#L31) 
- `reactiveweb`
  - [`trackedFunction`](https://github.com/universal-ember/reactiveweb/blob/ba40c8a4417ec8b76bfb37754262f2829c6f7b26/reactiveweb/src/function.ts#L1) 
- `tracked-draft`
  - [`draftFor`](https://github.com/chriskrycho/tracked-draft)

## Related Projects 

- [Jotai](https://jotai.org/)
- [Pota](https://pota.quack.uy) 
- [`@preact-signals/*`](https://github.com/XantreDev/preact-signals)
- [Svelte's Runes](https://svelte-5-preview.vercel.app/docs/runes#$state-frozen-reactive-map-set-and-date)
- [`@vue-reactivity/use`](https://github.com/vue-reactivity/use)
- [Metron](https://github.com/robbiespeed/metron/tree/0.0.3/packages/core#list)
- [Solid's Utils](https://www.solidjs.com/docs/latest/api#getters)
