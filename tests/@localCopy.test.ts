import { describe, test, assert } from 'vitest';
import { localCopy } from '../src/local-copy.ts';

describe('@localCopy', () => {
  test('it works', function() {
    class Remote {
      value = 123;
    }

    let remote = new Remote();

    class Local {
      remote = remote;

      @localCopy('remote.value') accessor value!: number;
    }

    let local = new Local();

    assert.strictEqual(local.value, 123, 'defaults to the remote value');

    local.value = 456;

    assert.strictEqual(local.value, 456, 'local value updates correctly');
    assert.strictEqual(remote.value, 123, 'remote value does not update');

    remote.value = 789;

    assert.strictEqual(
      local.value,
      789,
      'local value updates to new remote value'
    );
    assert.strictEqual(remote.value, 789, 'remote value is updated');
  });

  test('it requires a path or getter', function() {
    assert.throws(() => {
      class Local {
        // @ts-expect-error
        @localCopy accessor value;
      }

      new Local();
    }, /@localCopy\(\) must be given a memo path/);
  });

  test('value initializer works', function() {
    class Remote {
      value: unknown;
    }

    let remote = new Remote();

    class Local {
      remote = remote;

      @localCopy('remote.value', 123) accessor value!: unknown;
    }

    let local = new Local();

    assert.strictEqual(local.value, 123, 'defaults to the initializer value');
    assert.strictEqual(remote.value, undefined, 'remote value is undefined');

    local.value = 456;

    assert.strictEqual(local.value, 456, 'local value updates correctly');
    assert.strictEqual(remote.value, undefined, 'remote value does not update');

    remote.value = 789;

    assert.strictEqual(
      local.value,
      789,
      'local value updates to new remote value'
    );
    assert.strictEqual(remote.value, 789, 'remote value is updated');
  });

  test('function initializer works', function() {
    class Remote {
      value: unknown;
    }

    let remote = new Remote();

    class Local {
      remote = remote;

      @localCopy('remote.value', () => 123) accessor value: unknown;
    }

    let local = new Local();

    assert.strictEqual(local.value, 123, 'defaults to the initializer value');
    assert.strictEqual(remote.value, undefined, 'remote value is undefined');

    local.value = 456;

    assert.strictEqual(local.value, 456, 'local value updates correctly');
    assert.strictEqual(remote.value, undefined, 'remote value does not update');

    remote.value = 789;

    assert.strictEqual(
      local.value,
      789,
      'local value updates to new remote value'
    );
    assert.strictEqual(remote.value, 789, 'remote value is updated');
  });

  test('it works when setting the value locally before accessing it', function() {
    class Remote {
      value = 123;
    }

    let remote = new Remote();

    class Local {
      remote = remote;

      @localCopy('remote.value') accessor value!: number;
    }

    let local = new Local();

    // set the value before reading it
    local.value = 456;

    assert.strictEqual(local.value, 456, 'local value updates correctly');
    assert.strictEqual(remote.value, 123, 'remote value does not update');

    remote.value = 789;

    assert.strictEqual(
      local.value,
      789,
      'local value updates to new remote value'
    );
    assert.strictEqual(remote.value, 789, 'remote value is updated');
  });
});
