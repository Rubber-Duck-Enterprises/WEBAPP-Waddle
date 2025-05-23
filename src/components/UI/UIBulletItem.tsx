// components/UI/UIBulletItem.tsx
import React from "react";

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  color?: string;
  children: React.ReactNode;
}

const UIBulletItem: React.FC<Props> = ({ active = false, color = "#ccc", children, style, ...props }) => {
  const borderColor = active ? color : "var(--bullet-border)";
  const backgroundColor = active ? `${color}1A` : "var(--bullet-bg)";

  return (
    <button
      {...props}
      style={{
        padding: "0.4rem 0.8rem",
        borderRadius: "999px",
        border: `1px solid ${borderColor}`,
        backgroundColor,
        color: active ? "var(--bullet-text-active)" : "var(--bullet-text)",
        display: "flex",
        alignItems: "center",
        gap: "0.4rem",
        cursor: "pointer",
        fontWeight: "bold",
        ...style,
      }}
    >
      {children}
    </button>
  );
};

export default UIBulletItem;
