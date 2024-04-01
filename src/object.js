import { Signal } from "signal-polyfill";

export class ReactiveObject {
  static fromEntries(entries) {
    return new ReactiveObject(Object.fromEntries(entries));
  }
  #storages = new Map();
  #collection = new Signal.State(null);

  constructor(obj = {}) {
    let proto = Object.getPrototypeOf(obj);
    let descs = Object.getOwnPropertyDescriptors(obj);

    let clone = Object.create(proto);

    for (let prop in descs) {
      Object.defineProperty(clone, prop, descs[prop]);
    }

    let self = this;

    return new Proxy(clone, {
      get(target, prop) {
        self.#readStorageFor(prop);

        return target[prop];
      },

      has(target, prop) {
        self.#readStorageFor(prop);

        return prop in target;
      },

      ownKeys(target) {
        self.#collection.get();

        return Reflect.ownKeys(target);
      },

      set(target, prop, value) {
        target[prop] = value;

        self.#dirtyStorageFor(prop);
        self.#dirtyCollection();

        return true;
      },

      deleteProperty(target, prop) {
        if (prop in target) {
          delete target[prop];
          self.#dirtyStorageFor(prop);
          self.#dirtyCollection();
        }

        return true;
      },

      getPrototypeOf() {
        return ReactiveObject.prototype;
      },
    });
  }

  #readStorageFor(key) {
    let storage = this.#storages.get(key);

    if (storage === undefined) {
      storage = createStorage(null, () => false);
      this.#storages.set(key, storage);
    }

    getValue(storage);
  }

  #dirtyStorageFor(key) {
    const storage = this.#storages.get(key);

    if (storage) {
      setValue(storage, null);
    }
  }

  #dirtyCollection() {
    setValue(this.#collection, null);
  }
}
