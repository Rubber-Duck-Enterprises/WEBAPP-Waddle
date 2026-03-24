import { describe, it } from "vitest";
import * as fc from "fast-check";
import { expect } from "vitest";
import { getSectionCardStyle } from "@/components/ToolWallet/SectionCards/SectionCardContainer";
import type { Section } from "@/types";

// ─── Arbitraries ─────────────────────────────────────────────────────────────

function arbitrarySectionWithColor(): fc.Arbitrary<Section> {
  return fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 30 }),
    type: fc.constantFrom("standard", "passive", "card", "savings" as const),
    color: fc.stringMatching(/^[0-9a-f]{6}$/).map((h) => `#${h}`),
    icon: fc.option(fc.string({ minLength: 1, maxLength: 10 }), { nil: undefined }),
    goal: fc.option(fc.float({ min: 0, max: 100_000, noNaN: true }), { nil: null }),
    createdAt: fc
      .date({ min: new Date("2020-01-01"), max: new Date("2025-01-01") })
      .filter((d) => !isNaN(d.getTime()))
      .map((d) => d.toISOString()),
  });
}

// ─── Property 4 ──────────────────────────────────────────────────────────────

/**
 * Feature: code-cleanup-refactor, Property 4: SectionCardContainer aplica estilos derivados de la sección
 * Validates: Requirements 4.2
 */
describe("SectionCardContainer — Property 4: aplica estilos derivados de la sección", () => {
  it("background y border contienen el color de la sección para cualquier sección con color definido", () => {
    fc.assert(
      fc.property(arbitrarySectionWithColor(), (section) => {
        const style = getSectionCardStyle(section);

        expect(style.background as string).toContain(section.color);
        expect(style.border as string).toContain(section.color);
      }),
      { numRuns: 100 }
    );
  });
});
