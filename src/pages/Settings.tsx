import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";

import UIToggle from "@/components/UI/UIToggle";
import UISelect from "@/components/UI/UISelect";
import UIButton from "@/components/UI/UIButton";
import UITextInput from "@/components/UI/UITextInput";
import UISettingsCard from "@/components/UI/UISettingsCard";
import GoogleSignInButton from "@/components/UI/GoogleSignInButton";
import DefaultLayout from "@/layouts/DefaultLayout";
import { useModal } from "@/context/ModalContext";
import { getSavedSettingsModal } from "@/components/Modal/Presets/System/SavedSettingsModal";
import { getTasksDeletedModal } from "@/components/Modal/Presets/List/TasksDeletedModal";

import { useTheme } from "@/hooks/useTheme";
import { useSettingsStore } from "@/stores/settingsStore";
import { useListStore } from "@/stores/listStore";
import { usePopUp } from "@/context/PopUpContext";
import { signInWithGoogle } from "@/lib/firebase";

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const { showModal, hideModal } = useModal();
  const { showPopUp } = usePopUp();
  const { theme, toggleTheme } = useTheme();
  const {
    autoDeleteDoneTasks,
    deleteTime,
    deleteFrequency,
    deleteDayOfWeek,
    startPath,
    dayStartTime,
    dayEndTime,
    setSetting,
    hydrated
  } = useSettingsStore();

  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(() => {
    return typeof Notification !== "undefined" ? Notification.permission : "default";
  });

  const [localTime, setLocalTime] = useState("");
  const [localFreq, setLocalFreq] = useState<"daily" | "weekly">("daily");
  const [localDay, setLocalDay] = useState(0);

  const saveSettings = () => {
    setSetting("deleteTime", localTime);
    setSetting("deleteFrequency", localFreq);
    setSetting("deleteDayOfWeek", localDay);
    showModal(getSavedSettingsModal({ onClose: hideModal }));
  };

  const handleDeleteTasks = () => {
    const completed = useListStore.getState().tasks.filter(t => t.isDone);

    if (completed.length === 0) {
      showModal(getTasksDeletedModal({ count: 0, onClose: hideModal }));
      return;
    }

    showModal(
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <h3 style={{ color: "var(--text-primary)" }}>⚠️ Confirmar eliminación</h3>
        <p style={{ color: "var(--text-secondary)" }}>
          Se eliminarán <strong>{completed.length}</strong> tarea{completed.length > 1 ? "s" : ""} completada{completed.length > 1 ? "s" : ""}. Esta acción no se puede deshacer.
        </p>
        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
          <UIButton variant="secondary" onClick={hideModal}>Cancelar</UIButton>
          <UIButton variant="danger" onClick={() => {
            completed.forEach(t => useListStore.getState().deleteTask(t.id));
            hideModal();
            showModal(getTasksDeletedModal({ count: completed.length, onClose: hideModal }));
          }}>
            🧹 Eliminar
          </UIButton>
        </div>
      </div>
    );
  };

  const requestNotificationAccess = async () => {
    const { requestPermissionAndToken } = await import("@/lib/firebase");
    await requestPermissionAndToken();
    setNotificationPermission(Notification.permission);
  };

  useEffect(() => {
    if (hydrated) {
      setLocalTime(deleteTime);
      setLocalFreq(deleteFrequency);
      setLocalDay(deleteDayOfWeek);
    }
  }, [hydrated, deleteTime, deleteFrequency, deleteDayOfWeek]);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
    });
    return () => unsubscribe();
  }, []);

  if (!hydrated) return null;

  return (
    <DefaultLayout>
      <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <h2>⚙️ Configuración</h2>

        {typeof Notification !== "undefined" && notificationPermission && (
          <>
            {notificationPermission === "default" && (
              <UISettingsCard variant="information">
                <h3>🔔 Notificaciones</h3>
                <p style={{ color: "var(--text-secondary)" }}>
                  Activa las notificaciones para recibir alertas importantes como limpiezas automáticas o recordatorios.
                </p>
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <UIButton variant="secondary" onClick={requestNotificationAccess}>
                    Permitir notificaciones
                  </UIButton>
                </div>
              </UISettingsCard>
            )}

            {notificationPermission === "denied" && (
              <UISettingsCard variant="danger">
                <h3>🔕 Notificaciones bloqueadas</h3>
                <p style={{ color: "var(--text-secondary)" }}>
                  Has bloqueado las notificaciones. Para activarlas, ve a la configuración del navegador y permite notificaciones para esta app.
                </p>
              </UISettingsCard>
            )}
          </>
        )}

        <UISettingsCard>
          <h3>🚪 Inicio automático</h3>
          <UISelect
            value={startPath}
            onChange={(e) => {
              setSetting("startPath", e.target.value);
              const label = e.target.value === "/wallet" ? "Waddle Wallet" : "Waddle List";
              showPopUp("SUCCESS", `Inicio cambiado a ${label}`);
            }}
          >
            <option value="/wallet">Waddle Wallet</option>
            <option value="/list">Waddle List</option>
          </UISelect>
        </UISettingsCard>

        <UISettingsCard>
          <h3>🎨 Apariencia</h3>
          <UIToggle
            label={theme === "light" ? "🌞 Tema claro" : "🌚 Tema oscuro"}
            checked={theme === "dark"}
            onChange={() => {
              toggleTheme();
              const newTheme = theme === "light" ? "oscuro" : "claro";
              showPopUp("SUCCESS", `Tema cambiado a ${newTheme}`);
            }}
          />
        </UISettingsCard>

        <UISettingsCard>
          <h3>✅ Tareas completadas</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <UIToggle
              label="🗑️ Limpieza automática"
              checked={autoDeleteDoneTasks}
              onChange={(val) => setSetting("autoDeleteDoneTasks", val)}
            />
            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "-0.5rem" }}>
              {autoDeleteDoneTasks
                ? "Las tareas completadas se eliminarán automáticamente"
                : "Las tareas completadas no se eliminarán automáticamente"}
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "row", gap: "1rem", alignItems: "center" }}>
            <UITextInput
              type="time"
              value={localTime}
              onChange={(e) => setLocalTime(e.target.value)}
              placeholder="Hora de eliminación"
            />

            <UISelect
              value={localFreq}
              onChange={(e) => setLocalFreq(e.target.value as "daily" | "weekly")}
            >
              <option value="" disabled>Selecciona una frecuencia</option>
              <option value="daily">Diario</option>
              <option value="weekly">Semanal</option>
            </UISelect>

            {localFreq === "weekly" && (
              <UISelect
                value={localDay.toString()}
                onChange={(e) => setLocalDay(Number(e.target.value))}
              >
                <option value="" disabled>Selecciona un día</option>
                {["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"].map((day, i) => (
                  <option key={i} value={i}>{day}</option>
                ))}
              </UISelect>
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <UIButton variant="danger" onClick={handleDeleteTasks}>
              🧹 Borrar tareas
            </UIButton>
            <UIButton onClick={saveSettings} variant="secondary">💾 Guardar</UIButton>
          </div>
        </UISettingsCard>

        <UISettingsCard>
          <h3>🕒 Horario personal</h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            Define cuándo comienza y termina tu día. Las notificaciones se programarán a partir de este horario.
          </p>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <label style={{ flex: 1 }}>
              Mi día comienza:
              <UITextInput
                type="time"
                value={dayStartTime}
                onChange={(e) => setSetting("dayStartTime", e.target.value)}
              />
            </label>

            <label style={{ flex: 1 }}>
              Termina:
              <UITextInput
                type="time"
                value={dayEndTime}
                onChange={(e) => setSetting("dayEndTime", e.target.value)}
              />
            </label>
          </div>
        </UISettingsCard>

        <UISettingsCard>
          <h3>☁ Respaldos</h3>

          {!firebaseUser ? (
            <div style={{ alignItems: "center", display: "flex", justifyContent: "space-between", gap: "1rem" }}>
              <p style={{ color: "var(--text-secondary)" }}>
                Conectar cuenta de Google para respaldo en la nube
              </p>
              <GoogleSignInButton
                label="Conectar"
                onClick={async () => {
                  const { requestPermissionAndToken, saveNotificationSettingsToFirestore } = await import("@/lib/firebase");
                  const token = await requestPermissionAndToken();
                  const user = await signInWithGoogle();
                  if (user && token) {
                    await saveNotificationSettingsToFirestore(token, user);
                  }
                  if (user) alert(`✅ Conectado como ${user.displayName}`);
                }}
              />
            </div>
          ) : (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <p style={{ color: "var(--text-secondary)" }}>
                Conectado como <br />
                <strong>{firebaseUser.displayName}</strong>
              </p>
              <UIButton
                variant="danger"
                onClick={async () => {
                  const { signOutOnly } = await import("@/lib/firebase");
                  await signOutOnly();
                  setFirebaseUser(null);
                }}
              >
                🔌 Desconectar
              </UIButton>
            </div>
          )}

          <UIButton variant="secondary" onClick={() => navigate("/backups")}>
            📦 Administrar respaldos
          </UIButton>
        </UISettingsCard>
      </div>
    </DefaultLayout>
  );
};

export default Settings;
