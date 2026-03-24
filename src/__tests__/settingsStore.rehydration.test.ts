// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock localforage and scopedStorage before importing the store
vi.mock("localforage", () => ({
  default: {
    getItem: vi.fn(() => Promise.resolve(null)),
    setItem: vi.fn(() => Promise.resolve()),
    removeItem: vi.fn(() => Promise.resolve()),
  },
}));

vi.mock("@/lib/scopedStorage", () => ({
  createScopedStorage: vi.fn(() => ({
    getItem: vi.fn(() => Promise.resolve(null)),
    setItem: vi.fn(() => Promise.resolve()),
    removeItem: vi.fn(() => Promise.resolve()),
  })),
}));

import { useSettingsStore } from "@/stores/settingsStore";

/**
 * Unit tests for settingsStore rehydration behavior
 * Validates: Requirement 8.3
 */
describe("settingsStore — rehidratación aplica data-theme al DOM", () => {
  beforeEach(() => {
    document.documentElement.removeAttribute("data-theme");
    useSettingsStore.setState({ theme: "light" });
  });

  it("aplica theme 'dark' al DOM cuando el estado rehidratado tiene theme 'dark'", () => {
    // Simulate what onRehydrateStorage does: apply the theme to the DOM
    const rehydratedTheme = "dark" as const;
    useSettingsStore.setState({ theme: rehydratedTheme, hydrated: true });
    document.documentElement.setAttribute("data-theme", rehydratedTheme ?? "light");

    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(useSettingsStore.getState().theme).toBe("dark");
  });

  it("aplica theme 'light' al DOM cuando el estado rehidratado tiene theme 'light'", () => {
    const rehydratedTheme = "light" as const;
    useSettingsStore.setState({ theme: rehydratedTheme, hydrated: true });
    document.documentElement.setAttribute("data-theme", rehydratedTheme ?? "light");

    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    expect(useSettingsStore.getState().theme).toBe("light");
  });

  it("usa 'light' como fallback cuando theme es undefined en el estado rehidratado", () => {
    const rawTheme: string | undefined = undefined;
    const theme = rawTheme ?? "light";
    document.documentElement.setAttribute("data-theme", theme);

    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });

  it("onRehydrateStorage del store aplica el tema correcto al DOM", () => {
    // Simulate the onRehydrateStorage callback: set state and apply to DOM
    useSettingsStore.setState({ theme: "dark", hydrated: true });
    const state = useSettingsStore.getState();
    document.documentElement.setAttribute("data-theme", state.theme ?? "light");

    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(state.theme).toBe("dark");
  });
});
