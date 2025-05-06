import React from "react";

interface Props {
  value: number;
  max: number;
  color?: string;
}

const UIProgressBar: React.FC<Props> = ({ value, max, color = "#4caf50" }) => {
  const percentage = Math.min(100, (value / max) * 100);

  return (
    <div
      style={{
        width: "100%",
        height: "12px",
        backgroundColor: "var(--progress-bg)",
        borderRadius: "8px",
        overflow: "hidden",
        boxShadow: "var(--progress-shadow)",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${percentage}%`,
          backgroundColor: color,
          transition: "width 0.3s ease",
        }}
      />
    </div>
  );
};

export default UIProgressBar;
