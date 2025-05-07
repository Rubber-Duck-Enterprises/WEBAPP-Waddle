import React, { useEffect, useState } from "react";
import UIToggle from "../components/UI/UIToggle";
import UISelect from "../components/UI/UISelect";
import UIButton from "../components/UI/UIButton";
import UITextInput from "../components/UI/UITextInput";
import DefaultLayout from "../layouts/DefaultLayout";
import { useTheme } from "../hooks/useTheme";
import { useSettingsStore } from "../stores/settingsStore";
import { useTaskStore } from "../stores/TaskStore";

const Settings: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const {
    autoDeleteDoneTasks,
    deleteTime,
    deleteFrequency,
    deleteDayOfWeek,
    setSetting,
    hydrated
  } = useSettingsStore();

  // Estados locales para el formulario
  const [localTime, setLocalTime] = useState("");
  const [localFreq, setLocalFreq] = useState<"daily" | "weekly">("daily");
  const [localDay, setLocalDay] = useState(0);

  // Sincronizar con el store una vez que esté cargado
  useEffect(() => {
    if (hydrated) {
      setLocalTime(deleteTime);
      setLocalFreq(deleteFrequency);
      setLocalDay(deleteDayOfWeek);
    }
  }, [hydrated, deleteTime, deleteFrequency, deleteDayOfWeek]);

  const saveSettings = () => {
    setSetting("deleteTime", localTime);
    setSetting("deleteFrequency", localFreq);
    setSetting("deleteDayOfWeek", localDay);
    console.log("✅ Cambios guardados");
  };

  if (!hydrated) return null;

  return (
    <DefaultLayout>
      <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <h2>⚙️ Configuración</h2>

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
            <UIButton
              variant="danger"
              onClick={() => {
                const completed = useTaskStore.getState().tasks.filter(t => t.isDone);
                completed.forEach(t => useTaskStore.getState().deleteTask(t.id));
                console.log(`🧹 Eliminadas manualmente ${completed.length} tareas completadas`);
              }}
            >
              🧹 Borrar tareas
            </UIButton>
            <UIButton onClick={saveSettings} variant="secondary">💾 Guardar</UIButton>
          </div>
        </div>


      </div>
    </DefaultLayout>
  );
};

export default Settings;
