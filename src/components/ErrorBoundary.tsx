import React from "react";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("🦆 ErrorBoundary caught:", error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "3rem 1.5rem",
            textAlign: "center",
            gap: "1rem",
            minHeight: "50vh",
          }}
        >
          <span style={{ fontSize: "3rem" }}>🦆💥</span>
          <h2 style={{ color: "var(--text-primary)", margin: 0 }}>Algo salió mal</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", maxWidth: 360 }}>
            Ocurrió un error inesperado. Puedes intentar recargar la sección o volver al inicio.
          </p>
          {this.state.error && (
            <details style={{ fontSize: "0.75rem", color: "var(--text-secondary)", maxWidth: 360 }}>
              <summary style={{ cursor: "pointer" }}>Detalles técnicos</summary>
              <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", marginTop: "0.5rem" }}>
                {this.state.error.message}
              </pre>
            </details>
          )}
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              onClick={this.handleReset}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "8px",
                border: "1px solid var(--border-color)",
                background: "var(--surface)",
                color: "var(--text-primary)",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              🔄 Reintentar
            </button>
            <button
              onClick={() => { window.location.href = "/"; }}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "8px",
                border: "none",
                background: "var(--text-primary)",
                color: "var(--background)",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              🏠 Ir al inicio
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
