import React from "react";
import MenuButton from "./MenuButton";

type Props = {
  onOpenMenu: () => void;
};

const Header: React.FC<Props> = ({ onOpenMenu }) => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "1rem",
        borderBottom: "1px solid var(--border-color)",
        background: "var(--background)",
        color: "var(--text-primary)",
      }}
    >
      <MenuButton onClick={onOpenMenu} />
      <span style={{ fontWeight: "bold", fontSize: "1.5rem" }}>Waddle 🐤</span>
      <div style={{ width: "1.5rem" }} />
    </div>
  );
};

export default Header;
