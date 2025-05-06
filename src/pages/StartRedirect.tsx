import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const StartRedirect: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/wallet");
  }, [navigate]);

  return null;
};

export default StartRedirect;
