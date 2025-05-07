// components/Drawer/DrawerLink.tsx
import React from "react";
import { useLocation } from "react-router-dom";

interface DrawerLinkProps {
  path: string;
  label: string;
  onClick: (path: string) => void;
}

const DrawerLink: React.FC<DrawerLinkProps> = ({ path, label, onClick }) => {
  const location = useLocation();
  const isActive = location.pathname.startsWith(path);

  return (
    <li
      onClick={() => onClick(path)}
      style={{
        cursor: "pointer",
        padding: "0.5rem 1rem",
        borderRadius: "0.5rem",
        border: isActive ? "1px solid var(--primary-color)" : "none",
        backgroundColor: isActive ? "var(--primary-bg)" : "transparent",
        color: "var(--text-primary)",
        fontWeight: isActive ? "bold" : "normal",
        transition: "background-color 0.2s ease",
      }}
    >
      {label}
    </li>
  );
};

export default DrawerLink;
