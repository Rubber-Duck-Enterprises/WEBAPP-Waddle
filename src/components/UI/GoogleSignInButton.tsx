import React from "react";

interface GoogleSignInButtonProps {
  onClick: () => void;
  disabled?: boolean;
  label?: string;
}

const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onClick,
  disabled = false,
  label = "Continuar con Google",
}) => {
  return (
    <button
      style={{
        alignItems: "center",
        display: "flex",
        backgroundColor: "white",
        border: "1px solid #ccc",
        borderRadius: "8px",
        padding: "0.5rem 1rem",
        color: "black",
        fontWeight: "bold",
        cursor: disabled ? "not-allowed" : "pointer",
        width: "100%",
        justifyContent: "center",
        opacity: disabled ? 0.6 : 1,
      }}
      onClick={onClick}
      disabled={disabled}
    >
      <img
        src="/assets/account/google.png"
        alt="Google Logo"
        style={{ width: "20px", marginRight: "0.5rem" }}
      />
      {label}
    </button>
  );
};

export default GoogleSignInButton;
