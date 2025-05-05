// components/UI/UIButton.tsx
import React from "react";

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "default";
  fullWidth?: boolean;
}

const UIButton: React.FC<Props> = ({ 
  variant = "default", 
  fullWidth = false, 
  style, 
  ...props 
}) => {
  const colors = {
    primary: "#4caf50",
    secondary: "#2196f3",
    danger: "#f44336",
    default: "#ccc",
  };

  return (
    <button
      {...props}
      style={{
        padding: "0.6rem",
        background: colors[variant],
        color: "#fff",
        border: "none",
        borderRadius: "8px",
        fontWeight: "bold",
        cursor: "pointer",
        width: fullWidth ? "100%" : undefined,
        ...style,
      }}
    />
  );
};

export default UIButton;
