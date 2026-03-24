import React from "react";
import { describe, it } from "vitest";
import * as fc from "fast-check";
import { expect } from "vitest";
import { createTransferExpenses, createAdjustBalanceHandler } from "@/utils/walletUtils";
import type { Section, Expense } from "@/types";

// ─── Arbitraries ─────────────────────────────────────────────────────────────

function arbitrarySection(): fc.Arbitrary<Section> {
  return fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 30 }),
    type: fc.option(fc.constantFrom("standard", "passive", "card", "savings" as const), {
      nil: undefined,
    }),
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

// ─── Helper: simulateAdjust ───────────────────────────────────────────────────
// Invokes the handler returned by createAdjustBalanceHandler and immediately
// simulates modal confirmation with `target`, without needing React rendering.

interface SimulateAdjustParams {
  balance: number;
  target: number;
  sectionId: string;
  onExpense: (expense: Omit<Expense, "id">) => void;
}

function simulateAdjust({ balance, target, sectionId, onExpense }: SimulateAdjustParams): void {
  const handler = createAdjustBalanceHandler({
    balance,
    sectionId,
    addExpense: onExpense,
    showModal: (content) => {
      // Extract the onConfirm prop from the React element and call it with target
      const element = content as React.ReactElement<{ onConfirm: (t: number) => void }>;
      element.props.onConfirm(target);
    },
    hideModal: () => {},
  });

  handler();
}

// ─── Property 5 ──────────────────────────────────────────────────────────────

/**
 * Feature: code-cleanup-refactor, Property 5: createTransferExpenses crea exactamente dos gastos con suma cero
 * Validates: Requirements 5.2, 5.7
 */
describe("createTransferExpenses — Property 5: crea exactamente dos gastos con suma cero", () => {
  it("addExpense se llama 2 veces y sum(amounts) ≈ 0 para cualquier par de secciones y monto positivo", () => {
    fc.assert(
      fc.property(
        arbitrarySection(),
        arbitrarySection(),
        fc.float({ min: Math.fround(0.01), noNaN: true }).filter(isFinite),
        fc.string(),
        (from, to, amount, notes) => {
          const created: Omit<Expense, "id">[] = [];

          createTransferExpenses(from, to, amount, notes, (e) => created.push(e));

          expect(created).toHaveLength(2);
          expect(created[0].amount + created[1].amount).toBeCloseTo(0, 10);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Property 6 ──────────────────────────────────────────────────────────────

/**
 * Feature: code-cleanup-refactor, Property 6: createAdjustBalanceHandler crea un gasto con el diferencial correcto
 * Validates: Requirements 6.2, 6.3
 */
describe("createAdjustBalanceHandler — Property 6: crea un gasto con el diferencial correcto", () => {
  it("amount === target - balance, adjustment === true, y no se crea gasto si target === balance", () => {
    fc.assert(
      fc.property(
        fc.float({ noNaN: true }),
        fc.float({ noNaN: true }),
        fc.string(),
        (balance, target, sectionId) => {
          const created: Omit<Expense, "id">[] = [];
          const diff = target - balance;

          simulateAdjust({ balance, target, sectionId, onExpense: (e) => created.push(e) });

          if (diff === 0) {
            expect(created).toHaveLength(0);
          } else {
            expect(created).toHaveLength(1);
            expect(created[0].amount).toBeCloseTo(diff, 10);
            expect(created[0].adjustment).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
