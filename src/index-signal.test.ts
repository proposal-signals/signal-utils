import { describe, it, assert } from 'vitest';

import { signal } from './index.ts';

describe('@signal', () => {
  it('works', () => {
    class State {
      @signal accessor #value = 3;

      get doubled() {
        return this.#value * 2;
      }

      increment = () => this.#value++;
    }

    let state = new State();

    assert.equal(state.doubled, 6);

    state.increment();

    assert.equal(state.doubled, 8);
  });
});
