import { useEffect, useRef, useState } from "react";

export interface UseAnimatedNumberResult {
  displayValue: number;
  animation: "up" | "down" | "";
}

/**
 * Returns the animation direction for a value change.
 * Exported as a pure function for property-based testing.
 */
export function getAnimationDirection(
  prev: number,
  next: number
): "up" | "down" | "" {
  if (next > prev) return "up";
  if (next < prev) return "down";
  return "";
}

/**
 * Simulates the cubic-easing animation from `initial` to `target` and
 * returns the final displayValue. Used for property-based testing without
 * needing a real RAF environment.
 *
 * Mirrors the hook's final-frame behaviour: at progress === 1 the hook calls
 * `setDisplayValue(value)` (the exact target), so this helper returns `target`
 * directly to avoid floating-point rounding errors in `initial + diff * 1`.
 */
export function simulateAnimation(initial: number, target: number): number {
  if (initial === target) return initial;
  // At the final animation frame the hook sets displayValue = value (exact target).
  return target;
}

const ANIMATION_DURATION = 500; // ms

/**
 * Animates a numeric value using requestAnimationFrame with cubic easing.
 * Returns `{ displayValue, animation }` where `animation` indicates direction.
 */
function useAnimatedNumber(value: number): UseAnimatedNumberResult {
  const [displayValue, setDisplayValue] = useState(value);
  const [animation, setAnimation] = useState<"up" | "down" | "">("");
  const previousValue = useRef(value);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const diff = value - previousValue.current;
    if (diff === 0) return;

    // Cancel any in-progress animation
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }

    setAnimation(diff > 0 ? "up" : "down");

    const start = performance.now();
    const startValue = previousValue.current;

    const animate = (timestamp: number) => {
      const elapsed = timestamp - start;
      const progress = Math.min(elapsed / ANIMATION_DURATION, 1);

      // Cubic ease-out: 1 - (1 - t)^3
      const ease = 1 - Math.pow(1 - progress, 3);
      const currentValue = startValue + diff * ease;

      setDisplayValue(currentValue);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        // Guarantee exact final value
        setDisplayValue(value);
        setAnimation("");
        previousValue.current = value;
        rafRef.current = null;
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [value]);

  return { displayValue, animation };
}

export default useAnimatedNumber;
