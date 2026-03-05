import type { StateStorage } from "zustand/middleware";
import { getScope } from "./userScope";

export function createScopedStorage(base: StateStorage): StateStorage {
  const scopedKey = (key: string) => `${key}-${getScope()}`;

  return {
    getItem: (name: string) => base.getItem(scopedKey(name)),
    setItem: (name: string, value: string) => base.setItem(scopedKey(name), value),
    removeItem: (name: string) => base.removeItem(scopedKey(name)),
  };
}