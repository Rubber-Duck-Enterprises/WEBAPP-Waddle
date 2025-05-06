import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import UIToggle from "../../components/UI/UIToggle";
import UIButton from "../../components/UI/UIButton";
import { useTheme } from "../../hooks/useTheme";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const Drawer: React.FC<Props> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

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
    onClose();
    navigate(path);
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

          <ul
            style={{
              listStyle: "none",
              padding: 0,
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
              color: "var(--text-primary)",
            }}
          >
            <li style={{ cursor: "pointer" }} onClick={() => handleNavigate("/wallet")}>
              💰 Waddle Wallet
            </li>
            <li style={{ cursor: "pointer" }} onClick={() => handleNavigate("/list")}>
              📝 Waddle List
            </li>
            <li style={{ cursor: "pointer" }} onClick={() => handleNavigate("/backups")}>
              ☁️ Respaldos
            </li>
            <li style={{ cursor: "pointer" }} onClick={() => handleNavigate("/settings")}>
              ⚙️ Configuración
            </li>
            <li>ℹ️ Sobre Waddle</li>
          </ul>
        </div>

        <div>
          {deferredPrompt && (
            <div style={{ marginTop: "1rem" }}>
            <UIButton onClick={handleInstallClick} variant="secondary" fullWidth>
              📲 Instalar app
            </UIButton>
          </div>
          )}

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              margin: "1rem 0",
            }}
          >
            <UIToggle
              label={theme === "light" ? "🌞 Claro" : "🌚 Oscuro"}
              checked={theme === "dark"}
              onChange={toggleTheme}
            />
          </div>

          <div
            style={{
              fontSize: "0.75rem",
              color: "var(--text-secondary)",
              textAlign: "center",
            }}
          >
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
