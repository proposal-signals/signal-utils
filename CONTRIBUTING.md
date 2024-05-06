## Questions

Questions can be asked for on the [Issue Tracker](https://github.com/proposal-signals/signal-utils/issues) for this repo. While all questions are welcome, be sure to give the README a read just in case your question is already answered.

## Reporting a Bug

1. Update to the most recent main release if possible. We may have already fixed your bug.
1. Search for similar issues. It's possible somebody has encountered this bug already.
1. Provide a demo that specifically shows the problem. This demo should be fully operational with the exception of the bug you want to demonstrate. You may provide a repo or use a JSBin forked from: https://jsbin.com/safoqap/edit?html,output
. The more pared down, the better. If it is not possible to produce a demo, please make sure you provide very specific steps to reproduce the error. If we cannot reproduce it, we will close the ticket.
1. Your issue will be verified. The provided example will be tested for correctness. We'll work with you until your issue can be verified.
1. If possible, submit a Pull Request with a failing test. Better yet, take a stab at fixing the bug yourself if you can!

## Developing

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
