// hooks/useKonamiUniversalCode.ts
import { useEffect, useRef } from "react";

type Direction = "up" | "down" | "left" | "right" | "tap" | "doubleTap";
const konamiTouchSequence: Direction[] = [
  "up", "up",
  "down", "down",
  "left", "right",
  "left", "right",
  "doubleTap", "tap",
];
const konamiKeySequence = [
  "ArrowUp", "ArrowUp",
  "ArrowDown", "ArrowDown",
  "ArrowLeft", "ArrowRight",
  "ArrowLeft", "ArrowRight",
  "b", "a"
];

export const useKonamiUniversalCode = (onActivate: () => void) => {
  const touchSequence = useRef<Direction[]>([]);
  const keySequence = useRef<string[]>([]);
  const lastTap = useRef<number>(0);
  const startX = useRef(0);
  const startY = useRef(0);
  let singleTapTimeout: ReturnType<typeof setTimeout> | null = null;
  const DOUBLE_TAP_DELAY = 300;


  useEffect(() => {
    // 🖱️ PC / teclado
    const handleKeyDown = (e: KeyboardEvent) => {
      keySequence.current.push(e.key);
      if (keySequence.current.length > konamiKeySequence.length) {
        keySequence.current.shift();
      }

      if (JSON.stringify(keySequence.current) === JSON.stringify(konamiKeySequence)) {
        onActivate();
        keySequence.current = [];
      }
    };

    // 📱 Táctil
    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      startX.current = touch.clientX;
      startY.current = touch.clientY;
    };

    
    const handleTouchEnd = (e: TouchEvent) => {
      const touch = e.changedTouches[0];
      const dx = touch.clientX - startX.current;
      const dy = touch.clientY - startY.current;
    
      const now = Date.now();
      const deltaTime = now - lastTap.current;
    
      let direction: Direction | null = null;
    
      if (Math.abs(dx) > Math.abs(dy)) {
        direction = dx > 30 ? "right" : dx < -30 ? "left" : null;
      } else {
        direction = dy > 30 ? "down" : dy < -30 ? "up" : null;
      }
    
      if (!direction) {
        if (deltaTime < DOUBLE_TAP_DELAY) {
          if (singleTapTimeout) {
            clearTimeout(singleTapTimeout);
            singleTapTimeout = null;
          }
          direction = "doubleTap";
          touchSequence.current.push(direction);
          lastTap.current = 0;
        } else {
          singleTapTimeout = setTimeout(() => {
            direction = "tap";
            touchSequence.current.push(direction);
            if (touchSequence.current.length > konamiTouchSequence.length) {
              touchSequence.current.shift();
            }
            if (JSON.stringify(touchSequence.current) === JSON.stringify(konamiTouchSequence)) {
              onActivate();
              touchSequence.current = [];
            }
            singleTapTimeout = null;
          }, DOUBLE_TAP_DELAY);
          lastTap.current = now;
        }
      } else {
        touchSequence.current.push(direction);
      }
    
      if (direction) {
        if (touchSequence.current.length > konamiTouchSequence.length) {
          touchSequence.current.shift();
        }
    
        if (JSON.stringify(touchSequence.current) === JSON.stringify(konamiTouchSequence)) {
          onActivate();
          touchSequence.current = [];
        }
      }
    };

    // 🔗 Escuchas
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("touchstart", handleTouchStart);
    window.addEventListener("touchend", handleTouchEnd);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [onActivate]);
};
