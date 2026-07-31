import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import UIButton from "@/components/UI/UIButton";
import UIToggle from "@/components/UI/UIToggle";
import DrawerLink from "./DrawerLink";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import styles from "./Navigation.module.css";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const Drawer: React.FC<Props> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const { user, loading, logoutToAnon } = useAuth();

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;
      if (result.outcome === "accepted") {
        console.log("PWA instalada");
      }
      setDeferredPrompt(null);
    }
  };

  const handleNavigate = (path: string) => {
    if (location.pathname !== path) {
      navigate(path);
    }
    onClose();
  };

  const handleAuthAction = async () => {
    if (loading) return;

    if (!user) {
      handleNavigate("/login");
      return;
    }

    try {
      await logoutToAnon();
      navigate("/wallet", { replace: true });
    } finally {
      onClose();
    }
  };

  return (
    <>
      <div
        className={`${styles.drawer} ${isOpen ? styles.drawerOpen : styles.drawerClosed}`}
        role="navigation"
        aria-label="Menú principal"
        aria-hidden={!isOpen}
      >
        <div>
          <h2 className={styles.drawerTitle}>Menú</h2>
          <div className={styles.drawerDivider} />

          <ul className={styles.drawerList}>
            <DrawerLink path="/wallet" label="💰 Waddle Wallet" onClick={handleNavigate} />
            <DrawerLink path="/shopping" label="🛒 Waddle Shopping" onClick={handleNavigate} />
            <DrawerLink path="/list" label="📝 Waddle List" onClick={handleNavigate} />
            <DrawerLink path="/settings" label="⚙️ Configuración" onClick={handleNavigate} />
            <DrawerLink path="/about" label="ℹ️ Sobre Waddle" onClick={handleNavigate} />
          </ul>
        </div>

        <div>
          <div className={styles.drawerFooter}>
            {!loading && user && (
              <div className={styles.drawerUserInfo}>
                <div className={styles.drawerUserName}>
                  {user.displayName || "Usuario"}
                </div>
                <div className={styles.drawerUserEmail}>{user.email}</div>
              </div>
            )}

            <UIButton
              onClick={handleAuthAction}
              variant={user ? "secondary" : "primary"}
              fullWidth
              disabled={loading}
            >
              {loading ? "..." : user ? "🚪 Cerrar sesión" : "🔐 Iniciar sesión"}
            </UIButton>
          </div>

          {deferredPrompt && (
            <div style={{ marginTop: "0.75rem" }}>
              <UIButton onClick={handleInstallClick} variant="secondary" fullWidth>
                📲 Instalar app
              </UIButton>
            </div>
          )}

          <div className={styles.drawerThemeToggle}>
            <UIToggle
              label={theme === "light" ? "🌞 Claro" : "🌚 Oscuro"}
              checked={theme === "dark"}
              onChange={toggleTheme}
            />
          </div>

          <div className={styles.drawerVersion}>
            v{__APP_VERSION__}
          </div>
        </div>
      </div>

      <div
        className={`${styles.drawerOverlay} ${isOpen ? styles.drawerOverlayVisible : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />
    </>
  );
};

export default Drawer;
