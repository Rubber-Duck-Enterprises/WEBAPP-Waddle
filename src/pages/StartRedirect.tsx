import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSettingsStore } from "../stores/settingsStore";

const StartRedirect: React.FC = () => {
  const navigate = useNavigate();
  const { startPath } = useSettingsStore();

  useEffect(() => {
    if (startPath === "/") {
      useSettingsStore.setState({ startPath: "/wallet" });
    }
    navigate(startPath || "/wallet", { replace: true });
  }, [navigate, startPath]);

  return null;
};

export default StartRedirect;
