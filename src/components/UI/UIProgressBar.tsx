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
        backgroundColor: "#e0e0e0",
        borderRadius: "8px",
        overflow: "hidden",
        boxShadow: "inset 0 1px 2px rgba(0,0,0,0.1)",
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
