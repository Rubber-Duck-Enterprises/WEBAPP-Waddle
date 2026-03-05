import type { StateStorage } from "zustand/middleware";
import { getScope } from "./userScope";

export function createScopedStorage(base: StateStorage): StateStorage {
  const scopedKey = (key: string) => `${key}-${getScope()}`;

  return {
    getItem: (name: string) => {
      const key = scopedKey(name);
      console.log("📖 getItem", { name, key });
      return base.getItem(key);
    },
    setItem: (name: string, value: string) => {
      const key = scopedKey(name);
      console.log("💾 setItem", { name, key, valueLength: value.length });
      return base.setItem(key, value);
    },
    removeItem: (name: string) => {
      const key = scopedKey(name);
      console.log("🗑️ removeItem", { name, key });
      return base.removeItem(key);
    },
  };
}