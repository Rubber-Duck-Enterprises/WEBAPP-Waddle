import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import UIButton from "@/components/UI/UIButton";
import UIToggle from "@/components/UI/UIToggle";
import DrawerLink from "./DrawerLink";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";

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
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

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

    // Si es anon -> manda a login
    if (!user) {
      handleNavigate("/login");
      return;
    }

    // Si hay user -> logout a anon
    try {
      await logoutToAnon();
      // opcional: manda a wallet o donde quieras
      navigate("/wallet", { replace: true });
    } finally {
      onClose();
    }
  };

  return (
    <>
      <div
        style={{
          position: "fixed",
          top: 0,
          left: isOpen ? 0 : "-250px",
          width: "250px",
          height: "100%",
          backgroundColor: "var(--background)",
          boxShadow: "2px 0 8px rgba(0, 0, 0, 0.1)",
          transition: "left 0.3s ease-in-out, background-color 0.3s ease-in-out",
          zIndex: 1000,
          padding: "1rem",
          paddingTop: "calc(1rem + var(--safe-area-top))",
          paddingBottom: "calc(1rem + var(--safe-area-bottom))",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div>
          <h2 style={{ color: "var(--text-primary)" }}>Menú</h2>
          <div
            style={{
              backgroundColor: "var(--border-color)",
              margin: "1rem 0",
              height: "1px",
              width: "100%",
            }}
          />

          <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <DrawerLink path="/wallet" label="💰 Waddle Wallet" onClick={handleNavigate} />
            <DrawerLink path="/list" label="📝 Waddle List" onClick={handleNavigate} />
            {/* <DrawerLink path="/backups" label="☁️ Respaldos" onClick={handleNavigate} /> */}
            <DrawerLink path="/settings" label="⚙️ Configuración" onClick={handleNavigate} />
            <DrawerLink path="/about" label="ℹ️ Sobre Waddle" onClick={handleNavigate} />
          </ul>
        </div>

        <div>
          {/* Auth action */}
          <div style={{ marginTop: "1rem" }}>
            {/* Info opcional */}
            {!loading && user && (
              <div style={{ marginBottom: "0.5rem", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>
                  {user.displayName || "Usuario"}
                </div>
                <div style={{ opacity: 0.85 }}>{user.email}</div>
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

          <div style={{ display: "flex", justifyContent: "center", margin: "1rem 0" }}>
            <UIToggle
              label={theme === "light" ? "🌞 Claro" : "🌚 Oscuro"}
              checked={theme === "dark"}
              onChange={toggleTheme}
            />
          </div>

          <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", textAlign: "center" }}>
            v{__APP_VERSION__}
          </div>
        </div>
      </div>

      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0,0,0,0.3)",
            zIndex: 999,
          }}
        />
      )}
    </>
  );
};

export default Drawer;