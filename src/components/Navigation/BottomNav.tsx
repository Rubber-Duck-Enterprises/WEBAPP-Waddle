import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import styles from "./Navigation.module.css";

const BottomNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: "/wallet", label: "Inicio", emoji: "🏠" },
    { path: "/wallet/movements", label: "Movimientos", emoji: "🧾" },
    { path: "/wallet/sections", label: "Apartados", emoji: "📁" },
  ];

  return (
    <nav className={styles.bottomNav} aria-label="Navegación principal">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={styles.navButton}
            data-active={isActive}
            aria-label={item.label}
            aria-current={isActive ? "page" : undefined}
          >
            <span className={styles.navButtonIcon}>{item.emoji}</span>
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNav;
