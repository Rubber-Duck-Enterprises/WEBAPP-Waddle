// src/components/NotificationsInitializer.tsx
import { useEffect } from "react";
import { useModal } from "../../context/ModalContext";
import { getNotificationsRequestModal } from "./Presets/NotificationsRequestModal";

export default function NotificationsInitializer() {
  const { showModal, hideModal } = useModal();

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      const timeout = setTimeout(() => {
        showModal(getNotificationsRequestModal({ onClose: hideModal }));
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, []);

  return null;
}
