import { signal } from './index.ts';

class Meta {
  prevRemote;
  peek;
  @signal accessor value;
}

function getOrCreateMeta(instance, metas, initializer) {
  let meta = metas.get(instance);

  if (meta === undefined) {
    meta = new Meta();
    metas.set(instance, meta);

    meta.value = meta.peek =
      typeof initializer === 'function'
        ? initializer.call(instance)
        : initializer;
  }

  return meta;
}

function get(obj, path) {
  let current = obj;
  let parts = path.split('.');

  for (let part of parts) {
    if (!(part in current)) {
      throw new Error(`sub-path ${part} (from ${path}) does not exist on ${JSON.stringify(current)}.`);
    }

    current = current[part];

  }

  return current;
}

/**
 * 
 */
export function localCopy(memo: string, initializer?: unknown | (() => unknown)) {
  if (typeof memo !== 'string') {
    throw new Error(
      `@localCopy() must be given a memo path as its first argument, received \`${String(
        memo
      )}\``);
  }

  let metas = new WeakMap();

  return function localCopyDecorator<Value = any>(
    target: ClassAccessorDecoratorTarget<unknown, Value>,
    context: ClassAccessorDecoratorContext<unknown, Value>
  ): ClassAccessorDecoratorResult<unknown, Value> {
    let memoFn = (obj) => get(obj, memo);

    return {
      get() {
        let meta = getOrCreateMeta(this, metas, initializer);
        let { prevRemote } = meta;

        let incomingValue = memoFn(this, prevRemote);

        if (prevRemote !== incomingValue) {
          // If the incoming value is not the same as the previous incoming value,
          // update the local value to match the new incoming value, and update
          // the previous incoming value.
          meta.value = meta.prevRemote = incomingValue;
        }

        return meta.value;
      },

      set(value) {
        if (!metas.has(this)) {
          let meta = getOrCreateMeta(this, metas, initializer);
          meta.prevRemote = memoFn(this);
          meta.value = value;
          return;
        }

        getOrCreateMeta(this, metas, initializer).value = value;
      },
    };
  };
}

