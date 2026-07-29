// stores/settingsStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import localforage from "localforage";
import { createScopedStorage } from "@/lib/scopedStorage";

type SettingKey = Exclude<keyof SettingsStore, "hydrated" | "setSetting">;

interface SettingsStore {
  autoDeleteDoneTasks: boolean;
  deleteTime: string;
  deleteFrequency: "daily" | "weekly";
  deleteDayOfWeek: number;
  startPath: string;
  favouriteEmojis: string[];
  favouriteColors: string[];
  dayStartTime: string;
  dayEndTime: string;
  theme: "light" | "dark";
  hydrated: boolean;
  setFavouriteEmojis: (emojis: string[]) => void;
  setFavouriteColors: (colors: string[]) => void;
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
      favouriteEmojis: ["💵", "🏠", "🍔"],
      favouriteColors: ["#4caf50", "#2196f3", "#e91e63"],
      dayStartTime: "08:00",
      dayEndTime: "22:00",
      theme: "light",
      hydrated: false,
      setFavouriteEmojis: (emojis) => set({ favouriteEmojis: emojis }),
      setFavouriteColors: (colors) => set({ favouriteColors: colors }),
      setSetting: (key, value) => {
        set({ [key]: value });
        if (key === "theme") {
          const themeStr = value as "light" | "dark";
          const html = document.documentElement;
          html.setAttribute("data-theme", themeStr);
          try { localStorage.setItem("waddle-theme", themeStr); } catch {}
        }
      },
    }),
    {
      name: "waddle-settings",
      storage: createJSONStorage(() => createScopedStorage(localforage)),
      onRehydrateStorage: () => (state, error) => {
        if (!error && state) {
          useSettingsStore.setState({ hydrated: true });
          const theme = state.theme ?? "light";
          const html = document.documentElement;
          html.classList.add("theme-loading");
          html.setAttribute("data-theme", theme);
          // Espejo síncrono para que index.html pueda leerlo antes de React
          try { localStorage.setItem("waddle-theme", theme); } catch {}

          // Si el splash loader sigue presente y no se ha iniciado, activarlo con el tema rehidratado
          const splash = document.getElementById("waddle-splash");
          if (splash && !(window as any).__waddleSplashStarted) {
            (window as any).__waddleSplashStarted = true;
            splash.classList.add("splash-start");
          }

          // Re-habilitar transiciones después del repaint
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              html.classList.remove("theme-loading");
            });
          });
        }
      },
    }
  )
);
