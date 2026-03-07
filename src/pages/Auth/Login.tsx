import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

import UIButton from "@/components/UI/UIButton";
import UITextInput from "@/components/UI/UITextInput";
import { usePopUp } from "@/context/PopUpContext";

type LocationState = { from?: { pathname?: string } };
type Mode = "login" | "signup";

const cardStyle: React.CSSProperties = {
  maxWidth: 420,
  margin: "0 auto",
  marginTop: "10vh",
  padding: "1.25rem",
  borderRadius: 14,
  border: "1px solid var(--border-color)",
  background: "var(--background)",
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  marginBottom: 6,
  fontSize: "1.6rem",
  fontWeight: 900,
  color: "var(--text-primary)",
};

const subStyle: React.CSSProperties = {
  marginTop: 0,
  marginBottom: 16,
  color: "var(--text-secondary)",
  lineHeight: 1.35,
};

const labelStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 800,
  color: "var(--text-secondary)",
  marginBottom: 6,
};

const helperStyle: React.CSSProperties = {
  fontSize: 12,
  color: "var(--text-secondary)",
  marginTop: 6,
  opacity: 0.85,
};

const rowBetween: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  marginTop: 10,
};

const linkBtn: React.CSSProperties = {
  background: "transparent",
  border: "none",
  padding: 0,
  color: "var(--text-secondary)",
  textDecoration: "underline",
  cursor: "pointer",
  fontWeight: 700,
  fontSize: 13,
};

const dividerRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  margin: "14px 0",
};

const dividerLine: React.CSSProperties = {
  flex: 1,
  height: 1,
  background: "var(--border-color)",
  opacity: 0.8,
};

const Login: React.FC = () => {
  const { loginGoogle, user, loading } = useAuth();
  const { showPopUp } = usePopUp();

  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;

  const redirectTo = useMemo(() => state?.from?.pathname || "/wallet", [state]);

  const [mode, setMode] = useState<Mode>("login");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const goApp = () => navigate(redirectTo, { replace: true });

  const handleGoogle = async () => {
    try {
      setBusy(true);

      const u = await loginGoogle();

      if (u) {
        const { requestPermissionAndToken, saveNotificationSettingsToFirestore } = await import("@/lib/firebase");
        const token = await requestPermissionAndToken();
        if (token) await saveNotificationSettingsToFirestore(token, u);

        showPopUp("SUCCESS", `Conectado como ${u.displayName || "Usuario"}`);
        goApp();
      }
    } catch (e: any) {
      console.error("Login - Google error:", e);
      showPopUp("DANGER", e?.message || "No se pudo iniciar sesión con Google.");
    } finally {
      setBusy(false);
    }
  };

  const handleEmailLogin = async () => {
    try {
      if (!email.trim()) {
        showPopUp("DANGER", "Escribe tu correo.");
        return;
      }
      if (!password) {
        showPopUp("DANGER", "Escribe tu contraseña.");
        return;
      }

      setBusy(true);

      const { signInWithEmail, requestPermissionAndToken, saveNotificationSettingsToFirestore } =
        await import("@/lib/firebase");

      const u = await signInWithEmail(email.trim(), password);

      if (u) {
        const token = await requestPermissionAndToken();
        if (token) await saveNotificationSettingsToFirestore(token, u);

        showPopUp("SUCCESS", "Sesión iniciada.");
        goApp();
      }
    } catch (e: any) {
      console.error("Login - Email error:", e);
      showPopUp("DANGER", e?.message || "No se pudo iniciar sesión. Revisa tu correo y contraseña.");
    } finally {
      setBusy(false);
    }
  };

  const handleEmailSignup = async () => {
    try {
      if (!email.trim()) {
        showPopUp("DANGER", "Escribe tu correo.");
        return;
      }
      if (password.length < 6) {
        showPopUp("DANGER", "La contraseña debe tener mínimo 6 caracteres.");
        return;
      }

      setBusy(true);

      const { signUpWithEmail } = await import("@/lib/firebase");

      const u = await signUpWithEmail(email.trim(), password, displayName.trim() || undefined);

      if (u) {
        showPopUp("SUCCESS", "Cuenta creada.");
        goApp();
      }
    } catch (e: any) {
      console.error("Login - Signup error:", e);
      showPopUp("DANGER", e?.message || "No se pudo crear la cuenta.");
    } finally {
      setBusy(false);
    }
  };

  const handleForgotPassword = async () => {
    try {
      if (!email.trim()) {
        showPopUp("DANGER", "Escribe tu correo para enviarte el link de recuperación.");
        return;
      }

      setBusy(true);
      const { resetPassword } = await import("@/lib/firebase");
      await resetPassword(email.trim());

      showPopUp("SUCCESS", "Te enviamos un correo para recuperar tu contraseña.");
    } catch (e: any) {
      console.error("Login - resetPassword error:", e);
      showPopUp("DANGER", e?.message || "No se pudo enviar el correo de recuperación.");
    } finally {
      setBusy(false);
    }
  };

  const handleContinueAnon = () => {
    navigate("/wallet", { replace: true });
  };

  if (loading) return null;

  if (user) {
    return (
      <div style={{ padding: "1rem", margin: "auto", width: "100vw" }}>
        <div style={cardStyle}>
          <h2 style={titleStyle}>Ya iniciaste sesión</h2>
          <p style={subStyle}>Estás conectado como:</p>

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontWeight: 900, color: "var(--text-primary)" }}>{user.displayName || "Usuario"}</div>
            <div style={{ color: "var(--text-secondary)", fontSize: 13 }}>{user.email}</div>
          </div>

          <UIButton variant="primary" fullWidth onClick={goApp}>
            Ir a la app
          </UIButton>

          <div style={{ marginTop: 10, textAlign: "center" }}>
            <button style={linkBtn} onClick={handleContinueAnon}>
              Continuar en modo anónimo
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isSignup = mode === "signup";

  return (
    <div style={{ padding: "1rem", width: "100vw" }}>
      <div style={cardStyle}>
        <h2 style={titleStyle}>{isSignup ? "Crear cuenta" : "Inicia sesión"}</h2>
        <p style={subStyle}>Para backups, sincronización y Pro.</p>

        {isSignup && (
          <div style={{ marginBottom: 12 }}>
            <div style={labelStyle}>Nombre (opcional)</div>
            <UITextInput
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="John Doe"
              autoComplete="name"
              disabled={busy}
            />
          </div>
        )}

        <div style={{ marginBottom: 12 }}>
          <div style={labelStyle}>Correo</div>
          <UITextInput
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@correo.com"
            inputMode="email"
            autoComplete="email"
            disabled={busy}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={labelStyle}>Contraseña</div>
          <UITextInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            type="password"
            autoComplete={isSignup ? "new-password" : "current-password"}
            disabled={busy}
          />
          {isSignup && <div style={helperStyle}>Mínimo 6 caracteres.</div>}
        </div>

        <UIButton
          variant="primary"
          fullWidth
          disabled={busy}
          onClick={isSignup ? handleEmailSignup : handleEmailLogin}
        >
          {busy ? "Procesando..." : isSignup ? "Crear cuenta" : "Entrar"}
        </UIButton>

        <div style={rowBetween}>
          {isSignup ? (
            <>
              <button style={linkBtn} disabled={busy} onClick={() => setMode("login")}>
                Iniciar sesión
              </button>
              <span />
            </>
          ) : (
            <>
              <button style={linkBtn} disabled={busy} onClick={() => setMode("signup")}>
                Crear cuenta
              </button>
              <button style={linkBtn} disabled={busy} onClick={handleForgotPassword}>
                Olvidé mi contraseña
              </button>
            </>
          )}
        </div>

        <div style={dividerRow}>
          <div style={dividerLine} />
          <div style={{ fontSize: 12, opacity: 0.7, color: "var(--text-secondary)", fontWeight: 900 }}>OR</div>
          <div style={dividerLine} />
        </div>

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
            cursor: "pointer",
            width: "100%",
            justifyContent: "center"
          }}
          onClick={handleGoogle}
        >
          <img
            src="/assets/account/google.png"
            alt="Google Logo"
            style={{ width: "20px", marginRight: "0.5rem" }}
          />
          Continuar con google
        </button>

        <div style={{ marginTop: 10 }}>
          <UIButton variant="default" fullWidth disabled={busy} onClick={handleContinueAnon}>
            Continuar sin cuenta
          </UIButton>
        </div>

        <div style={{ marginTop: 12, fontSize: 12, color: "var(--text-secondary)", opacity: 0.85 }}>
          Tip: Puedes usar Waddle sin cuenta, pero para backups y Pro necesitas iniciar sesión.
        </div>
      </div>
    </div>
  );
};

export default Login;