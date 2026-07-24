import { useSettingsStore } from "@/stores/settingsStore";

export function useTheme() {
  const theme = useSettingsStore((s) => s.theme);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    useSettingsStore.getState().setSetting("theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    // Espejo síncrono para evitar flash al recargar
    try { localStorage.setItem("waddle-theme", newTheme); } catch {}
  };

  return { theme, toggleTheme };
}
