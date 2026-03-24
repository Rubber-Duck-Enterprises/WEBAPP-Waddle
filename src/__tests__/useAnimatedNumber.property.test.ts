import { describe, it } from "vitest";
import * as fc from "fast-check";
import { expect } from "vitest";
import { simulateAnimation, getAnimationDirection } from "@/hooks/useAnimatedNumber";

// ─── Property 2 ──────────────────────────────────────────────────────────────

/**
 * Feature: code-cleanup-refactor, Property 2: useAnimatedNumber converge al valor objetivo
 * Validates: Requirements 3.6
 */
describe("useAnimatedNumber — Property 2: converge al valor objetivo", () => {
  it("simulateAnimation(initial, target) ≈ target para cualquier par de floats", () => {
    fc.assert(
      fc.property(
        fc.float({ noNaN: true }),
        fc.float({ noNaN: true }),
        (initial, target) => {
          const finalValue = simulateAnimation(initial, target);
          expect(finalValue).toBeCloseTo(target, 5);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Property 3 ──────────────────────────────────────────────────────────────

/**
 * Feature: code-cleanup-refactor, Property 3: useAnimatedNumber indica la dirección correcta
 * Validates: Requirements 3.3
 */
describe("useAnimatedNumber — Property 3: indica la dirección correcta", () => {
  it("getAnimationDirection(prev, next) es 'up', 'down' o '' según corresponda", () => {
    fc.assert(
      fc.property(
        fc.float({ noNaN: true }),
        fc.float({ noNaN: true }),
        (prev, next) => {
          const direction = getAnimationDirection(prev, next);
          if (next > prev) expect(direction).toBe("up");
          else if (next < prev) expect(direction).toBe("down");
          else expect(direction).toBe("");
        }
      ),
      { numRuns: 100 }
    );
  });
});
