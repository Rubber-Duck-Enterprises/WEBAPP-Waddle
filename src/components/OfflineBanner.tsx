import React, { useEffect, useRef } from "react";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { usePopUp } from "@/context/PopUpContext";
import { saveAutoBackup } from "@/lib/backupService";

export const OfflineBanner: React.FC = () => {
  const { isOnline, wasOffline } = useNetworkStatus();
  const { showPopUp } = usePopUp();

  const prevOnlineRef = useRef<boolean>(isOnline);
  const initialMountRef = useRef<boolean>(true);

  useEffect(() => {
    // Fire toast ONCE on initial mount if offline or when network drops
    if (!isOnline && (initialMountRef.current || prevOnlineRef.current)) {
      showPopUp(
        "INFO",
        "Modo sin conexión: Puedes seguir registrando. Tus datos se guardan en tu dispositivo."
      );
      prevOnlineRef.current = false;
      initialMountRef.current = false;
      return;
    }

    // Fire toast ONCE when connection is restored
    if (isOnline && !prevOnlineRef.current && wasOffline) {
      showPopUp(
        "SUCCESS",
        "Conexión restablecida: Datos respaldados en la nube."
      );
      saveAutoBackup().catch((err) => {
        console.warn("Auto-sync on reconnect error:", err);
      });
      prevOnlineRef.current = true;
      initialMountRef.current = false;
      return;
    }

    prevOnlineRef.current = isOnline;
    initialMountRef.current = false;
  }, [isOnline, wasOffline, showPopUp]);

  return null;
};

export default OfflineBanner;
