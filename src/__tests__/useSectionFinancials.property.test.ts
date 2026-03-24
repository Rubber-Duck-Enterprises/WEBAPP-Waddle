import { describe, it } from "vitest";
import * as fc from "fast-check";
import { expect } from "vitest";
import { computeSectionFinancials } from "@/hooks/useSectionFinancials";
import type { Section, Expense } from "@/types";

// ─── Arbitraries ─────────────────────────────────────────────────────────────

function arbitrarySection(): fc.Arbitrary<Section> {
  return fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 30 }),
    type: fc.constantFrom("standard", "passive", "card", "savings" as const),
    color: fc.option(fc.stringMatching(/^[0-9a-f]{6}$/).map((h) => `#${h}`), {
      nil: undefined,
    }),
    icon: fc.option(fc.string({ minLength: 1, maxLength: 10 }), { nil: undefined }),
    goal: fc.option(fc.float({ min: 0, max: 100_000, noNaN: true }), { nil: null }),
    createdAt: fc
      .date({ min: new Date("2020-01-01"), max: new Date("2025-01-01") })
      .filter((d) => !isNaN(d.getTime()))
      .map((d) => d.toISOString()),
  });
}

function arbitraryExpense(sectionId?: fc.Arbitrary<string>): fc.Arbitrary<Expense> {
  const sid = sectionId ?? fc.uuid();
  return sid.chain((id) =>
    fc.record({
      id: fc.uuid(),
      description: fc.string({ minLength: 1, maxLength: 50 }),
      amount: fc.float({ min: -10_000, max: 10_000, noNaN: true }).filter((n) => n !== 0),
      category: fc.oneof(fc.constant(id), fc.uuid()),
      source: fc.option(fc.oneof(fc.constant(id), fc.uuid()), { nil: undefined }),
      date: fc
        .date({ min: new Date("2023-01-01"), max: new Date("2025-12-31") })
        .filter((d) => !isNaN(d.getTime()))
        .map((d) => d.toISOString()),
      kind: fc.option(fc.constantFrom("expense", "income", "debt", "payment" as const), {
        nil: undefined,
      }),
      notes: fc.option(fc.string({ minLength: 0, maxLength: 50 }), { nil: undefined }),
      adjustment: fc.option(fc.boolean(), { nil: undefined }),
      recurring: fc.option(fc.boolean(), { nil: undefined }),
    })
  );
}

interface DateRange {
  startDate: Date;
  endDate: Date;
}

function arbitraryDateRange(): fc.Arbitrary<DateRange> {
  return fc
    .tuple(
      fc.date({ min: new Date("2023-01-01"), max: new Date("2025-06-01") }),
      fc.date({ min: new Date("2023-01-01"), max: new Date("2025-12-31") })
    )
    .map(([a, b]) => ({
      startDate: a <= b ? a : b,
      endDate: a <= b ? b : a,
    }));
}

// ─── Property 1 ──────────────────────────────────────────────────────────────

/**
 * Feature: code-cleanup-refactor, Property 1: useSectionFinancials calcula correctamente los financieros
 * Validates: Requirements 2.2, 2.7
 */
describe("useSectionFinancials — Property 1: calcula correctamente los financieros", () => {
  it("balance === income + totalExpenses, income >= 0, totalExpenses <= 0, passive income === 0", () => {
    fc.assert(
      fc.property(
        arbitrarySection(),
        fc.array(arbitraryExpense(), { maxLength: 20 }),
        arbitraryDateRange(),
        (section, expenses, { startDate, endDate }) => {
          const result = computeSectionFinancials({ section, expenses, startDate, endDate });

          // balance must equal income + totalExpenses
          expect(result.balance).toBeCloseTo(result.income + result.totalExpenses, 10);

          // income is always non-negative
          expect(result.income).toBeGreaterThanOrEqual(0);

          // totalExpenses is always non-positive
          expect(result.totalExpenses).toBeLessThanOrEqual(0);

          // passive sections never have income
          if (section.type === "passive") {
            expect(result.income).toBe(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
