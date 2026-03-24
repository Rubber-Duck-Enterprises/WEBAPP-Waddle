import type { StateStorage } from "zustand/middleware";
import { getScope } from "./userScope";

let _paused = false;

export function pausePersistence() {
  _paused = true;
}

export function resumePersistence() {
  _paused = false;
}

export function createScopedStorage(base: StateStorage): StateStorage {
  const scopedKey = (key: string) => `${key}-${getScope()}`;

  return {
    getItem: (name: string) => {
      const key = scopedKey(name);
      return base.getItem(key);
    },
    setItem: (name: string, value: string) => {
      if (_paused) {
        return;
      }
      const key = scopedKey(name);
      return base.setItem(key, value);
    },
    removeItem: (name: string) => {
      if (_paused) {
        return;
      }
      const key = scopedKey(name);
      return base.removeItem(key);
    },
  };
}
