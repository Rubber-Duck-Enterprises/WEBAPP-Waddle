import React from "react";

type Props = {
  onClick: () => void;
};

const MenuButton: React.FC<Props> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      aria-label="Abrir menú"
      style={{
        background: "none",
        border: "none",
        fontSize: "1.5rem",
        color: "var(--text-primary)",
        cursor: "pointer",
      }}
    >
      ☰
    </button>
  );
};

export default MenuButton;
