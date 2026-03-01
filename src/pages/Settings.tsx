import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import localforage from "localforage";

import UIToggle from "@/components/UI/UIToggle";
import UISelect from "@/components/UI/UISelect";
import UIButton from "@/components/UI/UIButton";
import UITextInput from "@/components/UI/UITextInput";
import DefaultLayout from "@/layouts/DefaultLayout";
import { useModal } from "@/context/ModalContext";
import { getSavedSettingsModal } from "@/components/Modal/Presets/System/SavedSettingsModal";
import { getTasksDeletedModal } from "@/components/Modal/Presets/List/TasksDeletedModal";

import { useTheme } from "@/hooks/useTheme";
import { useSettingsStore } from "@/stores/settingsStore";
import { useTaskStore } from "@/stores/taskStore";
import { signInWithGoogle, saveBackupToCloud } from "@/lib/firebase";

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const { showModal, hideModal } = useModal();
  const { theme, toggleTheme } = useTheme();
  const {
    autoDeleteDoneTasks,
    deleteTime,
    deleteFrequency,
    deleteDayOfWeek,
    startPath,
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
    const completed = useTaskStore.getState().tasks.filter(t => t.isDone);
    completed.forEach(t => useTaskStore.getState().deleteTask(t.id));
  
    showModal(getTasksDeletedModal({ count: completed.length, onClose: hideModal }));
  };

  const requestNotificationAccess = async () => {
    const { requestPermissionAndToken } = await import("@/lib/firebase");
    const token = await requestPermissionAndToken();
    
    setNotificationPermission(Notification.permission);
  
    if (token) {
      console.log("✅ Token FCM:", token);
      console.log("✅ Notificaciones activadas");
    } else {
      console.log("❌ No se otorgaron permisos o ocurrió un error");
    }
  };

  const handleCloudBackup = async () => {
    if (!firebaseUser) {
      alert("Debes iniciar sesión primero.");
      return;
    }

    const keys: string[] = [
      "waddle-sections",
      "waddle-expenses",
      "waddle-task-lists",
      "waddle-tasks",
    ];

    const data: Record<string, any> = {};
    for (const key of keys) {
      data[key] = await localforage.getItem(key);
    }

    await saveBackupToCloud(data);
    alert("☁️ Respaldo subido correctamente a la nube.");
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
              <div 
                style={{
                  display: "flex",
                  backgroundColor: "var(--information-bg)",
                  border: "1px solid var(--information-color)",
                  borderRadius: "8px",
                  flexDirection: "column",
                  padding: "1rem",
                  gap: "1rem",
                }}
              >
                <h3>🔔 Notificaciones</h3>
                <p style={{ color: "var(--text-secondary)" }}>
                  Activa las notificaciones para recibir alertas importantes como limpiezas automáticas o recordatorios.
                </p>
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <UIButton variant="secondary" onClick={requestNotificationAccess}>
                    Permitir notificaciones
                  </UIButton>
                </div>
              </div>
            )}

            {notificationPermission === "denied" && (
              <div 
                style={{
                  display: "flex",
                  backgroundColor: "var(--danger-bg)",
                  border: "1px solid var(--danger-color)",
                  borderRadius: "8px",
                  flexDirection: "column",
                  padding: "1rem",
                  gap: "1rem",
                }}
              >
                <h3>🔕 Notificaciones bloqueadas</h3>
                <p style={{ color: "var(--text-secondary)" }}>
                  Has bloqueado las notificaciones. Para activarlas, ve a la configuración del navegador y permite notificaciones para esta app.
                </p>
              </div>
            )}
          </>
        )}

        {/* {notificationPermission === "granted" && (
          <div
            style={{
              display: "flex",
              backgroundColor: "var(--success-bg)",
              border: "1px solid var(--success-color)",
              borderRadius: "8px",
              flexDirection: "column",
              padding: "1rem",
              gap: "1rem",
            }}
          >
            <h3>🔔 Notificaciones activadas</h3>
            <p style={{ color: "var(--text-secondary)" }}>
              Las notificaciones están activadas. Recibirás alertas sobre eventos importantes como limpiezas automáticas.
            </p>
            <UIButton
              variant="secondary"
              onClick={async () => {
                const { requestPermissionAndToken } = await import("@/lib/firebase");
                const token = await requestPermissionAndToken();
                if (token) {
                  await navigator.clipboard.writeText(token);
                  alert("🔗 Token FCM copiado al portapapeles.");
                }
              }}
            >
              Copiar token FCM
            </UIButton>
          </div>
        )} */}

        <div
          style={{
            display: "flex",
            backgroundColor: "var(--surface)",
            border: "1px solid var(--border-color)",
            borderRadius: "8px",
            flexDirection: "column",
            padding: "1rem",
            gap: "1rem"
          }}
        >
          <h3>🚪 Inicio automático</h3>
          <UISelect
            value={startPath}
            onChange={(e) => setSetting("startPath", e.target.value)}
          >
            <option value="/wallet">Waddle Wallet</option>
            <option value="/list">Wadddle List</option>
          </UISelect>
        </div>

        <div 
          style={{ 
            display: "flex", 
            backgroundColor: "var(--surface)",
            border: "1px solid var(--border-color)",
            borderRadius: "8px",
            flexDirection: "column",
            padding: "1rem",
            gap: "1rem" 
          }}
        >
          <h3>🎨 Apariencia</h3>

          <UIToggle
            label={theme === "light" ? "🌞 Tema claro" : "🌚 Tema oscuro"}
            checked={theme === "dark"}
            onChange={toggleTheme}
          />
        </div>

        <div
          style={{ 
            display: "flex", 
            backgroundColor: "var(--surface)",
            border: "1px solid var(--border-color)",
            borderRadius: "8px",
            flexDirection: "column",
            padding: "1rem",
            gap: "1rem" 
          }}
        >
          <h3>✅ Tareas completadas</h3>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}
          >
            <UIToggle
              label="🗑️ Limpieza automática"
              checked={autoDeleteDoneTasks}
              onChange={(val) => setSetting("autoDeleteDoneTasks", val)}
            />
            <p
              style={{
                fontSize: "0.8rem",
                color: "var(--text-secondary)",
                marginTop: "-0.5rem",
              }}
            >
              {
                autoDeleteDoneTasks ? 
                  "Las tareas completadas se eliminarán automáticamente"
                  : 
                  "Las tareas completadas no se eliminarán automáticamente"
              }
            </p>
          </div>
        
          {/* Configuración de horario */}
          <div style={{
            display: "flex",
            flexDirection: "row",
            gap: "1rem",
            alignItems: "center",
            justifyContent: "flex-start"
          }}>
            <UITextInput
              type="time"
              value={localTime}
              onChange={(e) => setLocalTime(e.target.value)}
              placeholder="Hora de eliminación"
            />

            <UISelect
              value={localFreq}
              onChange={(e) => setLocalFreq(e.target.value as any)}
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

          {/* Botón guardar */}
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <UIButton variant="danger" onClick={handleDeleteTasks}>
              🧹 Borrar tareas
            </UIButton>
            <UIButton onClick={saveSettings} variant="secondary">💾 Guardar</UIButton>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            backgroundColor: "var(--surface)",
            border: "1px solid var(--border-color)",
            borderRadius: "8px",
            flexDirection: "column",
            padding: "1rem",
            gap: "1rem",
          }}
        >
          <h3>🕒 Horario personal</h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            Define cuándo comienza y termina tu día. Las notificaciones se programarán a partir de este horario.
          </p>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <label style={{ flex: 1 }}>
              Mi día comienza:
              <UITextInput
                type="time"
                value={useSettingsStore.getState().dayStartTime}
                onChange={(e) => setSetting("dayStartTime", e.target.value)}
              />
            </label>

            <label style={{ flex: 1 }}>
              Termina:
              <UITextInput
                type="time"
                value={useSettingsStore.getState().dayEndTime}
                onChange={(e) => setSetting("dayEndTime", e.target.value)}
              />
            </label>
          </div>
        </div>

        <div 
          style={{ 
            display: "flex", 
            backgroundColor: "var(--surface)",
            border: "1px solid var(--border-color)",
            borderRadius: "8px",
            flexDirection: "column",
            padding: "1rem",
            gap: "1rem" 
          }}
        >
          <h3>☁ Respaldos</h3>

          {!firebaseUser ? (
            <div
              style={{
                alignItems: "center",
                display: "flex",
                justifyContent: "space-between",
                gap: "1rem",
              }}
            >
              <p style={{ color: "var(--text-secondary)" }}>
                Conectar cuenta de Google para respaldo en la nube
              </p>
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
                }}
                onClick={async () => {
                  const { requestPermissionAndToken, saveNotificationSettingsToFirestore } = await import("@/lib/firebase");

                  const token = await requestPermissionAndToken();
                  const user = await signInWithGoogle();

                  if (user && token) {
                    await saveNotificationSettingsToFirestore(token, user);
                  }

                  if (user) alert(`✅ Conectado como ${user.displayName}`);
                }}
              >
                <img
                  src="/assets/account/google.png"
                  alt="Google Logo"
                  style={{ width: "20px", marginRight: "0.5rem" }}
                />
                Conectar
              </button>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <p style={{ color: "var(--text-secondary)" }}>
                  Conectado como <br/> 
                  <strong>{firebaseUser.displayName}</strong>
                </p>
                <UIButton
                  variant="danger"
                  onClick={async () => {
                    alert("🔌 Sesión cerrada y restaurado como anónimo.");
                  }}
                >
                  🔌 Desconectar
                </UIButton>
              </div>

              <UIButton variant="primary" onClick={handleCloudBackup}>
                ☁️ Hacer respaldo en la nube
              </UIButton>
            </>
          )}

          <UIButton variant="secondary" onClick={() => navigate("/backups")}>
            📦 Administrar respaldos
          </UIButton>
        </div>

      </div>
    </DefaultLayout>
  );
};

export default Settings;
