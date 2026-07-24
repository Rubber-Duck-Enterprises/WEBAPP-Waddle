import React from "react";

interface Props {
  children: React.ReactNode;
  variant?: "default" | "information" | "danger";
}

const variantStyles: Record<string, React.CSSProperties> = {
  default: {
    backgroundColor: "var(--surface)",
    border: "1px solid var(--border-color)",
  },
  information: {
    backgroundColor: "var(--information-bg)",
    border: "1px solid var(--information-color)",
  },
  danger: {
    backgroundColor: "var(--danger-bg)",
    border: "1px solid var(--danger-color)",
  },
};

const UISettingsCard: React.FC<Props> = ({ children, variant = "default" }) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        borderRadius: "8px",
        padding: "1rem",
        gap: "1rem",
        ...variantStyles[variant],
      }}
    >
      {children}
    </div>
  );
};

export default UISettingsCard;
