// @vitest-environment jsdom
import { describe, it, beforeEach, vi } from "vitest";
import { expect } from "vitest";
import * as fc from "fast-check";
import { renderHook, act } from "@testing-library/react";

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

import { useTheme } from "@/hooks/useTheme";
import { useSettingsStore } from "@/stores/settingsStore";

/**
 * Feature: code-cleanup-refactor, Property 8: toggleTheme actualiza store y DOM de forma consistente
 * Validates: Requirements 8.2, 8.5
 */
describe("useTheme — Property 8: toggleTheme actualiza store y DOM de forma consistente", () => {
  beforeEach(() => {
    useSettingsStore.setState({ theme: "light" });
    document.documentElement.removeAttribute("data-theme");
  });

  it("para cualquier estado inicial, toggleTheme produce el valor opuesto en store y DOM", () => {
    fc.assert(
      fc.property(
        fc.constantFrom("light" as const, "dark" as const),
        (initialTheme) => {
          useSettingsStore.setState({ theme: initialTheme });
          const { result } = renderHook(() => useTheme());

          act(() => {
            result.current.toggleTheme();
          });

          const expectedTheme = initialTheme === "light" ? "dark" : "light";
          expect(useSettingsStore.getState().theme).toBe(expectedTheme);
          expect(document.documentElement.getAttribute("data-theme")).toBe(expectedTheme);
        }
      ),
      { numRuns: 100 }
    );
  });
});
