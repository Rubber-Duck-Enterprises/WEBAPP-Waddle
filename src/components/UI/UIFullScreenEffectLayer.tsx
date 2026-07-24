import React, { useEffect, useRef } from "react";
import confetti from "canvas-confetti";

export const CELEBRATION_EVENT = "waddle:celebration";

/** Dispatch this event from anywhere to trigger confetti */
export function triggerCelebration() {
  window.dispatchEvent(new CustomEvent(CELEBRATION_EVENT));
}

const UIMotionEffectLayer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const myConfetti = confetti.create(canvasRef.current, {
      resize: true,
      useWorker: true,
    });

    const handleCelebration = () => {
      myConfetti({
        particleCount: 200,
        startVelocity: 60,
        spread: 90,
        origin: { y: 1 },
      });
    };

    window.addEventListener(CELEBRATION_EVENT, handleCelebration);
    return () => window.removeEventListener(CELEBRATION_EVENT, handleCelebration);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        width: "100vw",
        height: "100vh",
        zIndex: 9999,
      }}
    />
  );
};

export default UIMotionEffectLayer;
