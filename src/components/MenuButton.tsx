import React from "react";

type Props = {
  onClick: () => void;
};

const MenuButton: React.FC<Props> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      style={{
        background: "none",
        border: "none",
        fontSize: "1.5rem",
        cursor: "pointer",
      }}
    >
      ☰
    </button>
  );
};

export default MenuButton;
