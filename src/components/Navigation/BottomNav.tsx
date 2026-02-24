import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

const BottomNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: "/wallet", label: "Inicio", emoji: "🏠" },
    { path: "/wallet/movements", label: "Movimientos", emoji: "🧾" },
    { path: "/wallet/sections", label: "Apartados", emoji: "📁" },
  ];

  return (
    <nav
      style={{
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center",
        padding: "0.5rem 0",
        borderTop: "1px solid var(--border-color)",
        background: "var(--background)",
        position: "fixed",
        bottom: "var(--safe-area-bottom)",
        width: "100%",
        height: "56px",
      }}
    >
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            style={{
              background: "none",
              border: "none",
              color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
              fontWeight: isActive ? "bold" : "normal",
              fontSize: "1rem",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: "1.4rem" }}>{item.emoji}</span>
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNav;
