# signal-utils

Utils for the [Signal's Proposal](https://github.com/proposal-signals/proposal-signals).

Try it out on JSBin: https://jsbin.com/safoqap/edit?html,output

## Install

```bash
npm add signal-utils signal-polyfill
```

> [!NOTE]
> As of now, the Signals proposal isn't part of JavaScript, so you'll need to use a polyfill.
> See [signal-utils's peerDependency section in the package.json](https://github.com/proposal-signals/signal-utils/blob/main/package.json#L59) for the supported version range.

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
  - [localCopy](#localcopy-function)
  - [deep](#deep-function)
- class utilities
  - [@signal](#signal)
  - [@localCopy](#localcopy)
  - [@deepSignal](#deepSignal)
- subtle utilities
  - [effect](#leaky-effect-via-queuemicrotask)

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

This utility decorator can also be used for caching getters in classes. Useful for caching expensive computations. 

```js
import { signal } from 'signal-utils';

class State {
    @signal accessor #value = 3;

    // NOTE: read-only because there is no setter, and a setter is not allowed.
    @signal
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

### `@deepSignal`

A utility decorator for recursively, deeply, and lazily auto-tracking JSON-serializable structures at any depth or size.

```gjs
import { deepSignal } from 'signal-utils/deep';

class Foo {
  @deepSignal accessor obj = {};
}

let instance = new Foo();
let setData = () => instance.obj.foo = { bar: 3 };
let inc = () => instance.obj.foo.bar++;

<template>
  {{instance.obj.foo.bar}}

  <button onclick={{setData}}>Set initial data</button>
  <button> onclick={{inc}}>increment</button>
</template>
```

Note that this can be memory intensive, and should not be the default way to reach for reactivity. Due to the nature of nested proxies, it's also much harder to inspect.

Inspiration for deep reactivity comes from:
- [ember `@deepTracked`](https://github.com/NullVoxPopuli/ember-deep-tracked/blob/37c506d7f04c00c1f0ab31e740ef15a92bb99feb/ember-deep-tracked/src/-private/deep-tracked.ts#L1)
- [solid `store`](https://github.com/solidjs/solid/blob/ae56299c8d4cdedc03b835fdcff1004355da742f/packages/solid/store/src/store.ts#L1)
- [preact `deepSignal`](https://github.com/luisherranz/deepsignal?tab=readme-ov-file#deepsignal)
- [vue `reactive`](https://github.com/vuejs/core/blob/6d066dd852f6dbd70eb221c7f3367665c081026e/packages/reactivity/src/reactive.ts#L139)

### `deep` function

A utility decorator for recursively, deeply, and lazily auto-tracking JSON-serializable structures at any depth or size.

```gjs
import { deep } from 'signal-utils/deep';

let obj = deep({});
let setData = () => obj.foo = { bar: 3 };
let inc = () => obj.foo.bar++;

<template>
  {{obj.foo.bar}}

  <button onclick={{setData}}>Set initial data</button>
  <button> onclick={{inc}}>increment</button>
</template>
```

Note that this can be memory intensive, and should not be the default way to reach for reactivity. Due to the nature of nested proxies, it's also much harder to inspect.

### `@localCopy`

A utility decorator for maintaining local state that gets re-set to a "remote" value when it changes. Useful for editable controlled fields with an initial remote data that can also change.

```gjs
import { signal } from 'signal-utils';
import { localCopy } from 'signal-utils/local-copy';

class Remote {
  @signal accessor value = 3;
}

class Demo {
  // pretend this data is from a parent component
  remote = new Remote();
  
  @localCopy('remote.value') localValue;
  
  updateLocalValue = (inputEvent) => this.localValue = inputEvent.target.value;
  
  // A controlled input
  <template>
    <label>
      Edit Name:   
      <input value={{this.localValue}} oninput={{this.updateLocalValue}} />
    </label>
  </template>
}
```

In this demo, the localValue can fork from the remote value, but the `localValue` property will re-set to the remote value if it changes.

#### `localCopy` function

```js
import { Signal } from 'signal-polyfill';
import { localCopy } from 'signal-utils/local-copy';

const remote = new Signal.State(3);

const local = localCopy(() => remote.get());
const updateLocal = (inputEvent) => local.set(inputEvent.target.value);

// A controlled input
<template>
  <label>
    Edit Name:   
    <input value={{local.get()}} oninput={{updateLocal}} />
  </label>
</template>
```

Live, interactive demos of this concept:
- [Ember](https://limber.glimdown.com/edit?c=MQAgYg9gTg1glgOwOYgMoBcCG6CmIDuc6AFiAEo4C2EuIAqgA4Am2OAzgFAfHroNsAuAPRD0hXjigA6AMYRKQgPpQ2M4lDht0cTAiFbsAVzZCAjAHZzABgAcNgGwP7ATgDMAVlfnXzgCw2uAANgpAArNhAAGzgANxwOOEoGaHQQAG8oiBlMSIBhCAYATwBfEAAzKHkQAHJ0KEwZGBwmAFp0CAhIgCMIAA9qgG4EpJSQfJGEHARUiqrqgAEkaMpKSSE5Can0QeHkqFSMuoamphBS2coaxeXVqFF6xsQkHcS9g5AIBDPyysuFqi6a2oTDgZTgkh2HBkkUwbAiABEqBAQDhergEEwIuNkpNpukOCAQPNIlkcvkigAKaqYKBINhSGI5Qw4aoASky2UiADUmTghgSQIZmKwADKk7m8kAAXhAAsJFMQDEM6AAonFpuypQA%2BEAkTRSEmcnmRZnSkCK5VqrZSLC0nDoBm8-mE4i6JiRHCoQxdShEM1ykAUtje32q9XoTU6tIBwnBn1EK3TKQMKA4cOIsqYQyRdAU1lDQmF3XEfU0ulST5e%2BO5jKMk04ATF-WGnLG03FfMB4pcQkiEAAQRAcmmlUiHtOFvQAoAPLgkjDcFqA9OytBLmk0p8anHQ9Um-TXRiPVXQ8Vikui4TpzDAZEL5fCSqQakAHKYVaNwkxwvTycgOvMlKG56vSLYSvWZ7pJuXzVJOe4gVIQosLgYpGrykFCPeRbTkIN44HePaXtOXTKu0CBaieRA4SRvCfFhIA4auUCUEuy4pjgWpgW2DYPpewElqB4rcWexFQFqqbULQ8wATxG7SehxQ4exrHYVohQevRhJ-hkPRQEwkiNqYDC9CAbCdHATADGcy76Og6kcTOohUAwC4Od2HCom8ID6Zm2apNCsIRP2DAMCiaJTJiYzyDiWz4oS8xHI0zT-pKMoAEQALINHgADqiBMIYaUFkSiUnN52CYM6LpuseIZ%2BjKFLIZgkb7lITVmk1xVDoeSA4G%2Bqxmnm0o6ghMkgAA1DK1QAISQlec4uaw9HToi1BEjJQFpKNClEpWdXoJtCGHu6nr7RhKk-uoF2ErkWZsHgqK4FACA5N1ui9YGlCYIUgKmYk2bYE8ICYCAqYVOwpAQGUoNIrQTWsgIy40WRUFbtU0JwI08ECbIPV9e%2BOBnlqt3GHgKrhc9r25Hj1GkXRhFXldAYirCqSURITACKJy3KRuABSqAAPIvlIWgaMgoKFK17UINmkQgK4IlCMpjkLa5S7dsEgQcEAA&format=glimdown)
- [Preact](https://preactjs.com/repl?code=aW1wb3J0IHsgcmVuZGVyIH0gZnJvbSAncHJlYWN0JzsKaW1wb3J0IHsgdXNlUmVmLCB1c2VFZmZlY3QgfSBmcm9tICdwcmVhY3QvaG9va3MnOwppbXBvcnQgeyBzaWduYWwsIGVmZmVjdCwgdXNlU2lnbmFsIH0gZnJvbSAnQHByZWFjdC9zaWduYWxzJzsKaW1wb3J0IHsgaHRtbCB9IGZyb20gJ2h0bS9wcmVhY3QnOwoKZnVuY3Rpb24gdXNlTG9jYWxDb3B5KHJlbW90ZSkgewoJY29uc3QgbG9jYWwgPSB1c2VSZWYoKTsKCWlmICghbG9jYWwuY3VycmVudCkgewoJCWxvY2FsLmN1cnJlbnQgPSBzaWduYWwocmVtb3RlLnBlZWsoKSk7Cgl9CgoJdXNlRWZmZWN0KCgpID0%2BIHsKCSAgLy8gU3luY2hyb25vdXNseSB1cGRhdGUgdGhlIGxvY2FsIGNvcHkgd2hlbiByZW1vdGUgY2hhbmdlcy4KCSAgLy8gQ29yZSBlZmZlY3RzIGFyZSBqdXN0IGEgd2F5IHRvIGhhdmUgc3luY2hyb25vdXMgY2FsbGJhY2tzCgkgIC8vIHJlYWN0IHRvIHNpZ25hbCBjaGFuZ2VzIGluIGEgcHJldHR5IGVmZmljaWVudCB3YXkuCgkJcmV0dXJuIGVmZmVjdCgoKSA9PiB7CgkJCWxvY2FsLmN1cnJlbnQudmFsdWUgPSByZW1vdGUudmFsdWU7CgkJfSk7Cgl9LCBbcmVtb3RlXSk7CgoJcmV0dXJuIGxvY2FsLmN1cnJlbnQ7Cn0KCmZ1bmN0aW9uIERlbW8oeyBuYW1lLCBvblN1Ym1pdCB9KSB7CgkJY29uc3QgbG9jYWxOYW1lID0gdXNlTG9jYWxDb3B5KG5hbWUpOwoKICAgIGNvbnN0IHVwZGF0ZUxvY2FsTmFtZSA9IChpbnB1dEV2ZW50KSA9PiBsb2NhbE5hbWUudmFsdWUgPSBpbnB1dEV2ZW50LnRhcmdldC52YWx1ZTsKCiAgICBjb25zdCBoYW5kbGVTdWJtaXQgPSAoc3VibWl0RXZlbnQpID0%2BIHsKICAgICAgICBzdWJtaXRFdmVudC5wcmV2ZW50RGVmYXVsdCgpOwogICAgICAgIG9uU3VibWl0KHsgdmFsdWU6IGxvY2FsTmFtZS52YWx1ZSB9KTsKICAgIH0KCiAgICByZXR1cm4gaHRtbGAKICAgICAgICA8Zm9ybSBvblN1Ym1pdD0ke2hhbmRsZVN1Ym1pdH0%2BCiAgICAgICAgICAgIDxsYWJlbD4KICAgICAgICAgICAgICAgIEVkaXQgTmFtZTogICAKICAgICAgICAgICAgICAgIDxpbnB1dCB2YWx1ZT0ke2xvY2FsTmFtZS52YWx1ZX0gb25JbnB1dD0ke3VwZGF0ZUxvY2FsTmFtZX0gLz4KICAgICAgICAgICAgPC9sYWJlbD4KCiAgICAgICAgICAgIDxidXR0b24%2BU3VibWl0PC9idXR0b24%2BCiAgICAgICAgPC9mb3JtPgoKICAgICAgICA8cHJlPmxvY2FsVmFsdWU6ICR7bG9jYWxOYW1lfTxiciAvPnBhcmVudCB2YWx1ZTogJHtuYW1lfTwvcHJlPmA7Cn0KCmV4cG9ydCBmdW5jdGlvbiBBcHAoKSB7CiAgICBjb25zdCBuYW1lID0gdXNlU2lnbmFsKCdNYWNlIFdpbmR1Jyk7CiAgICBjb25zdCBkYXRhID0gdXNlU2lnbmFsKCcnKTsKCiAgICBjb25zdCBoYW5kbGVTdWJtaXQgPSAoZCkgPT4gZGF0YS52YWx1ZSA9IGQ7CiAgICBjb25zdCBjaGFuZ2VOYW1lID0gKCkgPT4gbmFtZS52YWx1ZSArPSAnISc7CgogICAgcmV0dXJuIGh0bWxgCiAgICAgICAgPCR7RGVtb30gbmFtZT0ke25hbWV9IG9uU3VibWl0PSR7aGFuZGxlU3VibWl0fSAvPgoKICAgICAgICA8aHIgLz4KCiAgICAgICAgQ2F1c2UgZXh0ZXJuYWwgY2hhbmdlIChtYXliZSBzaW11bGF0aW5nIGEgcmVmcmVzaCBvZiByZW1vdGUgZGF0YSk6CiAgICAgICAgPGJ1dHRvbiBvbkNsaWNrPSR7Y2hhbmdlTmFtZX0%2BQ2F1c2UgRXh0ZXJuYWwgQ2hhbmdlPC9idXR0b24%2BCgogICAgICAgIDxociAvPgogICAgICAgIExhc3QgU3VibWl0dGVkOjxiciAvPgogICAgICAgIDxwcmU%2BJHtKU09OLnN0cmluZ2lmeShkYXRhLnZhbHVlLCBudWxsLCAzKX08L3ByZT5gOwp9CgpyZW5kZXIoPEFwcCAvPiwgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2FwcCcpKTsK)
- [Solid](https://playground.solidjs.com/anonymous/0cf7972e-f55d-4483-909d-6c172c80d5ac)

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

### `dedupe` + `@dedupe`

wip

utilities for the [dedupe](https://github.com/tracked-tools/tracked-toolbox?tab=readme-ov-file#dedupetracked) pattern.

### Draft

wip

Forking a reactive tree and optionally sync it back to the original -- useful for forms / fields where you want to edit the state, but don't want to mutate the reactive root right away.

Inspo: https://github.com/chriskrycho/tracked-draft

### subtle utilities

Utilities that can easily lead to subtle bugs and edge cases.

#### Leaky Effect via queueMicrotask

```js
import { Signal } from 'signal-polyfill';
import { effect } from 'signal-utils/subtle/microtask-effect';

let count = new Signal.State(0);

let callCount = 0;

effect(() => console.log(count.get());
// => 0 logs

count.set(1);
// => 1 logs
```

## Contributing


Have [pnpm installed](https://pnpm.io/installation).

**Install dependencies**
```bash
pnpm install
```

**Start tests in watch mode**

```bash
pnpm vitest --watch
```

This is the primary way to work on this package. You can use relative imports in the tests to import source files to unit test whatever needs to be unit tested.

**Start build in watch mode**

This isn't needed unless you're preparing for release, or needing to debug how the package si built.
```bash
pnpm start
```

This will start a [concurrently](https://www.npmjs.com/package/concurrently) command that runs the vite build and vitest tests in parallel.

Vitest isn't being used _within_ the package, because we want to exercise the public API, generated types, etc (through package.json#exports and all that).

**Preparing a Pull Request**

- ensure the build succeeds: `pnpm build`
- ensure that formatting has ran: `pnpm format`
- ensere that tests pass: `pnpm test`

And that's it!

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
