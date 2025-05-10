// stores/settingsStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import localforage from "localforage";

type SettingKey = Exclude<keyof SettingsStore, "hydrated" | "setSetting">;

interface SettingsStore {
  autoDeleteDoneTasks: boolean;
  deleteTime: string;
  deleteFrequency: "daily" | "weekly";
  deleteDayOfWeek: number;
  startPath: string;
  hydrated: boolean;
  setSetting: <K extends SettingKey>(key: K, value: SettingsStore[K]) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      autoDeleteDoneTasks: false,
      deleteTime: "00:00",
      deleteFrequency: "daily",
      deleteDayOfWeek: 0,
      startPath: "/wallet",
      hydrated: false,
      setSetting: (key, value) => set({ [key]: value }),
    }),
    {
      name: "waddle-settings",
      storage: createJSONStorage(() => localforage),
      onRehydrateStorage: () => (state, error) => {
        if (!error && state?.hydrated !== undefined) {
          useSettingsStore.setState({ hydrated: true });
        }
      },
    }
  )
);
