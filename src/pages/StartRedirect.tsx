import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSettingsStore } from "@/stores/settingsStore";

const StartRedirect: React.FC = () => {
  const navigate = useNavigate();
  const { startPath, hydrated } = useSettingsStore();

  useEffect(() => {
    if (!hydrated) return;
    if (startPath === "/") {
      useSettingsStore.setState({ startPath: "/wallet" });
      navigate("/wallet", { replace: true });
    } else {
      navigate(startPath, { replace: true });
    }
  }, [navigate, startPath, hydrated]);

  return null;
};

export default StartRedirect;
