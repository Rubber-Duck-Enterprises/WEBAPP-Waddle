// pages/Backups.tsx
import React, { useRef, useState } from "react";
import { FiPlus } from "react-icons/fi";
import DefaultLayout from "@/layouts/DefaultLayout";
import UIButton from "@/components/UI/UIButton";
import { useModal } from "@/context/ModalContext";
import { getImportSuccessModal } from "@/components/Modal/Presets/System/ImportSuccessModal";
import { useSessionStore } from "@/stores/sessionStore";
import { useWalletStore } from "@/stores/walletStore";
import { useListStore } from "@/stores/listStore";
import {
  saveCloudBackup,
  loadCloudBackup,
  loadCloudBackupHistory,
  exportBackupToFile,
  importBackupFromFile,
  restoreFromSnapshot,
  getBackupFilename,
} from "@/lib/backupService";
import { serializeBackup } from "@/lib/backupSerializer";
import type { BackupSnapshot } from "@/lib/backupTypes";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function originLabel(origin: string): string {
  return origin === "automatic" ? "automático" : "manual";
}

// ─── Card wrapper ─────────────────────────────────────────────────────────────

const Card: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      backgroundColor: "var(--surface)",
      border: "1px solid var(--border-color)",
      borderRadius: "8px",
      padding: "1rem",
      display: "flex",
      flexDirection: "column",
      gap: "1rem",
    }}
  >
    {children}
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────

const BackupPage: React.FC = () => {
  const { showModal, hideModal } = useModal();
  const { user, isPro, lastCloudBackupAt } = useSessionStore();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [history, setHistory] = useState<BackupSnapshot[] | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Shared helpers ──────────────────────────────────────────────────────────

  const withLoading = async (fn: () => Promise<void>) => {
    setIsLoading(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido.");
    } finally {
      setIsLoading(false);
    }
  };

  const showRestoreConfirm = (snapshot: BackupSnapshot) => {
    showModal(
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <h3 style={{ color: "var(--text-primary)" }}>⚠️ Confirmar restauración</h3>
        <p style={{ color: "var(--text-secondary)" }}>
          Esto reemplazará todos tus datos actuales con los del respaldo del{" "}
          <strong>{formatDate(snapshot.createdAt)}</strong>. Esta acción no se puede deshacer.
        </p>
        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
          <UIButton variant="secondary" onClick={hideModal} disabled={isLoading}>
            Cancelar
          </UIButton>
          <UIButton
            variant="danger"
            disabled={isLoading}
            onClick={async () => {
              hideModal();
              await withLoading(() => restoreFromSnapshot(snapshot));
            }}
          >
            Restaurar
          </UIButton>
        </div>
      </div>
    );
  };

  // ── Cloud Backup section ────────────────────────────────────────────────────

  const handleSaveCloud = () =>
    withLoading(async () => {
      await saveCloudBackup();
    });

  const handleLoadCloud = () =>
    withLoading(async () => {
      const snapshot = await loadCloudBackup();
      if (!snapshot) {
        setError("No hay ningún respaldo disponible en la nube.");
        return;
      }
      showRestoreConfirm(snapshot);
    });

  // ── Pro history ─────────────────────────────────────────────────────────────

  const handleLoadHistory = async () => {
    setHistoryLoading(true);
    try {
      const items = await loadCloudBackupHistory();
      setHistory(items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar historial.");
    } finally {
      setHistoryLoading(false);
    }
  };

  // ── Local export ────────────────────────────────────────────────────────────

  const handleExport = (scope: "full" | "wallet" | "list") =>
    withLoading(async () => {
      const walletState = useWalletStore.getState();
      const listState = useListStore.getState();
      const snapshot = serializeBackup(walletState, listState, "manual", scope);
      exportBackupToFile(snapshot, getBackupFilename());
    });

  // ── Local import ────────────────────────────────────────────────────────────

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset input so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = "";

    setImportError(null);
    setIsLoading(true);
    try {
      const snapshot = await importBackupFromFile(file);
      setIsLoading(false);
      showModal(
        getImportSuccessModal({
          onConfirm: () => {
            hideModal();
            showRestoreConfirm(snapshot);
          },
        })
      );
    } catch (e) {
      setIsLoading(false);
      setImportError(e instanceof Error ? e.message : "Error al importar archivo.");
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <DefaultLayout>
      <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "2rem" }}>
        <h2>☁️ Respaldos</h2>

        {/* Global error */}
        {error && (
          <p style={{ color: "var(--color-danger, #e53e3e)", fontSize: "0.9rem" }}>
            ⚠️ {error}
          </p>
        )}

        {/* Loading indicator */}
        {isLoading && (
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            ⏳ Procesando…
          </p>
        )}

        {/* ── Cloud Backup ── */}
        {user !== null ? (
          <Card>
            <h3>☁️ Respaldo en la nube</h3>

            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
              Último respaldo:{" "}
              <strong>
                {lastCloudBackupAt ? formatDate(lastCloudBackupAt) : "Sin respaldo en la nube"}
              </strong>
            </p>

            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <UIButton
                variant="primary"
                onClick={handleSaveCloud}
                disabled={isLoading}
              >
                💾 Guardar en la nube
              </UIButton>

              <UIButton
                variant="secondary"
                onClick={handleLoadCloud}
                disabled={isLoading}
              >
                🔄 Restaurar desde la nube
              </UIButton>
            </div>

            {/* Free Tier indicator */}
            {/* {!isPro && (
              // <div
              //   style={{
              //     backgroundColor: "var(--surface-alt, var(--surface))",
              //     border: "1px solid var(--border-color)",
              //     borderRadius: "6px",
              //     padding: "0.75rem",
              //     fontSize: "0.85rem",
              //     color: "var(--text-secondary)",
              //     display: "flex",
              //     alignItems: "center",
              //     justifyContent: "space-between",
              //     gap: "0.5rem",
              //     flexWrap: "wrap",
              //   }}
              // >
              //   <span>🔒 Plan gratuito: 1 slot de respaldo en la nube</span>
              //   <UIButton variant="primary" style={{ fontSize: "0.8rem", padding: "0.4rem 0.75rem" }}>
              //     ⭐ Actualizar a Pro
              //   </UIButton>
              // </div>
            )} */}

            {/* Pro history */}
            {isPro && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <h4 style={{ margin: 0 }}>📋 Historial de respaldos</h4>
                  <UIButton
                    variant="secondary"
                    style={{ fontSize: "0.8rem", padding: "0.3rem 0.6rem" }}
                    onClick={handleLoadHistory}
                    disabled={isLoading || historyLoading}
                  >
                    {historyLoading ? "Cargando…" : "Cargar historial"}
                  </UIButton>
                </div>

                {history !== null && history.length === 0 && (
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                    No hay respaldos en el historial.
                  </p>
                )}

                {history !== null && history.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {history.map((snap, i) => (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          border: "1px solid var(--border-color)",
                          borderRadius: "6px",
                          padding: "0.6rem 0.75rem",
                          fontSize: "0.9rem",
                          gap: "0.5rem",
                          flexWrap: "wrap",
                        }}
                      >
                        <span>
                          {formatDate(snap.createdAt)}{" "}
                          <span style={{ color: "var(--text-secondary)" }}>
                            ({originLabel(snap.origin)})
                          </span>
                        </span>
                        <UIButton
                          variant="secondary"
                          style={{ fontSize: "0.8rem", padding: "0.3rem 0.6rem" }}
                          disabled={isLoading}
                          onClick={() => showRestoreConfirm(snap)}
                        >
                          Restaurar
                        </UIButton>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Card>
        ) : (
          /* ── Anonymous user message ── */
          <Card>
            <h3>☁️ Respaldo en la nube</h3>
            <p style={{ color: "var(--text-secondary)" }}>
              Crea una cuenta o inicia sesión para guardar tus datos en la nube y acceder a ellos desde cualquier dispositivo.
            </p>
          </Card>
        )}

        {/* ── Local Export / Import ── */}
        <Card>
          <h3>💾 Exportación e importación local</h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", margin: 0 }}>
              Exportar como archivo JSON:
            </p>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <UIButton variant="secondary" onClick={() => handleExport("full")} disabled={isLoading}>
                📦 Respaldo completo
              </UIButton>
              <UIButton variant="secondary" onClick={() => handleExport("wallet")} disabled={isLoading}>
                💰 Solo Wallet
              </UIButton>
              <UIButton variant="secondary" onClick={() => handleExport("list")} disabled={isLoading}>
                📋 Solo Listas
              </UIButton>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", margin: 0 }}>
              Importar desde archivo JSON:
            </p>

            <label
              style={{
                backgroundColor: "var(--surface)",
                border: "2px dashed var(--text-secondary)",
                borderRadius: "8px",
                padding: "0.5rem",
                position: "relative",
                cursor: isLoading ? "not-allowed" : "pointer",
                opacity: isLoading ? 0.6 : 1,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--text-secondary)",
                  padding: "0.75rem",
                  gap: "0.5rem",
                }}
              >
                <FiPlus size={24} color="var(--text-secondary)" />
                <span>Seleccionar archivo de respaldo</span>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json"
                onChange={handleImport}
                disabled={isLoading}
                style={{ position: "absolute", inset: 0, opacity: 0, cursor: "inherit" }}
              />
            </label>

            {importError && (
              <p style={{ color: "var(--color-danger, #e53e3e)", fontSize: "0.85rem", margin: 0 }}>
                ⚠️ {importError}
              </p>
            )}
          </div>
        </Card>
      </div>
    </DefaultLayout>
  );
};

export default BackupPage;
