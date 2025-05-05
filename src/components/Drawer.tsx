import React from "react";
import { useNavigate } from "react-router-dom";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const Drawer: React.FC<Props> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

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
          backgroundColor: "#fff",
          boxShadow: "2px 0 8px rgba(0,0,0,0.1)",
          transition: "left 0.3s ease-in-out",
          zIndex: 1000,
          padding: "1rem",
        }}
      >
        <h2>Menú</h2>

        <div
          style={{
            backgroundColor: "#ddd",
            margin: "1rem 0",
            height: "1px",
            width: "100%",
          }}
        />

        <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <li
            style={{ cursor: "pointer" }}
            onClick={() => handleNavigate("/backups")}
          >
            ☁️ Respaldos
          </li>
          <li>⚙️ Configuración</li>
          <li>ℹ️ Sobre Waddle</li>
        </ul>
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
