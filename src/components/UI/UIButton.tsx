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
    primary: "var(--btn-primary-bg)",
    secondary: "var(--btn-secondary-bg)",
    danger: "var(--btn-danger-bg)",
    default: "var(--btn-default-bg)",
  };

  return (
    <button
      {...props}
      style={{
        padding: "0.6rem",
        background: colors[variant],
        color: "var(--btn-text-color)",
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
