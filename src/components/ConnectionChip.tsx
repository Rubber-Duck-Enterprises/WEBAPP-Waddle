import React, { useState } from "react";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { usePopUp } from "@/context/PopUpContext";

export const ConnectionChip: React.FC = () => {
  const { isOnline } = useNetworkStatus();
  const { showPopUp } = usePopUp();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded((prev) => !prev);

    if (!isOnline) {
      showPopUp(
        "INFO",
        "Modo sin conexión: Puedes seguir registrando. Tus datos se guardan en tu dispositivo."
      );
    } else {
      showPopUp("SUCCESS", "Conexión a internet activa.");
    }
  };

  const theme = !isOnline
    ? {
        color: "var(--danger-color)",
        bg: "var(--danger-bg)",
        label: "Sin conexión",
      }
    : {
        color: "var(--success-color)",
        bg: "var(--success-bg)",
        label: "Conectado",
      };

  return (
    <div
      tabIndex={0}
      role="button"
      onClick={handleClick}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
      onFocus={() => setIsExpanded(true)}
      onBlur={() => setIsExpanded(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "flex-start",
        height: "24px",
        padding: isExpanded ? "0 10px 0 7.5px" : "0 7.5px",
        borderRadius: "9999px",
        border: `1px solid ${theme.color}`,
        backgroundColor: theme.bg,
        color: theme.color,
        cursor: "pointer",
        userSelect: "none",
        gap: isExpanded ? "6px" : "0px",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        boxSizing: "border-box",
        zIndex: 10,
        outline: "none",
      }}
      title={theme.label}
    >
      {/* div.circulo verde/amarillo/rojo */}
      <div
        style={{
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          backgroundColor: theme.color,
          flexShrink: 0,
          boxShadow: `0 0 6px ${theme.color}`,
          margin: 0,
          padding: 0,
        }}
      />

      {/* span.texto de estado expandible fluidamente */}
      <span
        style={{
          fontSize: "12px",
          fontWeight: 600,
          lineHeight: 1,
          whiteSpace: "nowrap",
          overflow: "hidden",
          maxWidth: isExpanded ? "100px" : "0px",
          opacity: isExpanded ? 1 : 0,
          transition: "max-width 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease",
          color: theme.color,
          pointerEvents: "none",
        }}
      >
        {theme.label}
      </span>
    </div>
  );
};

export default ConnectionChip;
