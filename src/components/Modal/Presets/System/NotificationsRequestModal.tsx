// components/Modal/Presets/NotificationsRequestModal.tsx
import React from "react";
import UIButton from "@/components/UI/UIButton";

type Props = {
  onClose: () => void;
};

export const getNotificationsRequestModal = ({ onClose }: Props) => (
  <NotificationsRequestModal onClose={onClose} />
);

const NotificationsRequestModal: React.FC<Props> = ({ onClose }) => {
  const handleRequest = async () => {
    if ("Notification" in window) {
      try {
        const {
          requestPermissionAndToken,
          saveNotificationSettingsToFirestore,
        } = await import("@/lib/firebase");

        const token = await requestPermissionAndToken();

        if (token) {
          await new Promise((res) => setTimeout(res, 500));
          await saveNotificationSettingsToFirestore(token);
          console.log("✅ Token FCM y configuración horaria guardados en Firestore");
        } else {
          console.warn("⚠️ Permisos no otorgados o token no disponible");
        }
      } catch (error) {
        console.error("❌ Error al activar notificaciones:", error);
      }
    }
    onClose();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <h3>🔔 Activar notificaciones</h3>
      <p style={{ color: "var(--text-secondary)" }}>
        Permite que Waddle te envíe notificaciones para recordatorios y alertas importantes.
      </p>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
        <UIButton onClick={onClose} variant="danger">Cancelar</UIButton>
        <UIButton onClick={handleRequest} variant="secondary">Permitir</UIButton>
      </div>
    </div>
  );
};
