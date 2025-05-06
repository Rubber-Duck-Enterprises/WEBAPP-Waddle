import React, { useEffect, useRef } from "react";
import confetti from "canvas-confetti";

const UIMotionEffectLayer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const myConfetti = confetti.create(canvasRef.current, {
      resize: true,
      useWorker: true,
    });

    (window as any).triggerCelebration = () => {
      myConfetti({
        particleCount: 200,
        startVelocity: 60,
        spread: 90,
        origin: { y: 1 },
      });
    };
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
