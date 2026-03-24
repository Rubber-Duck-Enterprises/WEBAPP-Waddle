import { useSettingsStore } from "@/stores/settingsStore";

export function useTheme() {
  const theme = useSettingsStore((s) => s.theme);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    useSettingsStore.getState().setSetting("theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  return { theme, toggleTheme };
}
