import React, { useState } from "react";
import { TimeBlock } from "@/types";
import { useTimeBlockStore } from "@/stores/timeBlockStore";
import UITextInput from "@/components/UI/UITextInput";
import UIButton from "@/components/UI/UIButton";
import { usePopUp } from "@/context/PopUpContext";

type Props = {
  initialBlock?: TimeBlock | null;
  onConfirm: (blockData: Omit<TimeBlock, "id">) => void;
  onDelete?: () => void;
  onCancel: () => void;
};

export const getCreateEditBlockModal = (props: Props) => {
  return <CreateEditBlockModal {...props} />;
};

const DAYS_MAP = [
  { id: 1, label: "L" },
  { id: 2, label: "M" },
  { id: 3, label: "X" },
  { id: 4, label: "J" },
  { id: 5, label: "V" },
  { id: 6, label: "S" },
  { id: 0, label: "D" },
];

const PRESET_COLORS = ["#2196f3", "#4caf50", "#e91e63"];
const PRESET_EMOJIS = ["💼", "🍽️", "🧹"];

const CreateEditBlockModal: React.FC<Props> = ({
  initialBlock,
  onConfirm,
  onDelete,
  onCancel,
}) => {
  const { blocks } = useTimeBlockStore();
  const [name, setName] = useState(initialBlock?.name || "");
  const [startTime, setStartTime] = useState(initialBlock?.startTime || "09:00");
  const [endTime, setEndTime] = useState(initialBlock?.endTime || "12:00");
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(
    initialBlock?.daysOfWeek || [1, 2, 3, 4, 5]
  );
  
  // Grupo de tareas compartidas
  const [categoryKey, setCategoryKey] = useState(
    initialBlock?.categoryKey || (initialBlock?.name ? initialBlock.name.toLowerCase().trim() : "")
  );

  // Obtener lista de grupos existentes para sugerencias
  const existingGroups = Array.from(
    new Set(blocks.map((b) => b.categoryKey).filter(Boolean))
  ) as string[];

  // Color seleccionable
  const [selectedColor, setSelectedColor] = useState(initialBlock?.color || PRESET_COLORS[0]);
  const [customColor, setCustomColor] = useState("");
  
  // Emoji seleccionable
  const [selectedEmoji, setSelectedEmoji] = useState(initialBlock?.icon || PRESET_EMOJIS[0]);
  const [customEmoji, setCustomEmoji] = useState("");

  const { showPopUp } = usePopUp();

  const effectiveColor = customColor || selectedColor;
  const effectiveEmoji = customEmoji || selectedEmoji;

  const toggleDay = (dayId: number) => {
    if (daysOfWeek.includes(dayId)) {
      if (daysOfWeek.length === 1) return; // Conservar al menos 1 día
      setDaysOfWeek(daysOfWeek.filter((d) => d !== dayId));
    } else {
      setDaysOfWeek([...daysOfWeek, dayId]);
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      showPopUp("DANGER", "Por favor ingresa un nombre para el bloque.");
      return;
    }
    if (startTime >= endTime) {
      showPopUp("DANGER", "La hora de fin debe ser posterior a la hora de inicio.");
      return;
    }

    const groupKeyToSave = (categoryKey.trim() || name.trim()).toLowerCase();

    onConfirm({
      name: name.trim(),
      startTime,
      endTime,
      daysOfWeek,
      color: effectiveColor,
      icon: effectiveEmoji,
      categoryKey: groupKeyToSave,
    });
    showPopUp("SUCCESS", initialBlock ? "Bloque actualizado" : "Bloque creado");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <h3 style={{ color: "var(--text-primary)", margin: 0 }}>
        {initialBlock ? "✏️ Editar Bloque de Tiempo" : "⏰ Nuevo Bloque de Tiempo"}
      </h3>

      {/* 📝 Nombre */}
      <div>
        <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
          Nombre del bloque:
        </label>
        <UITextInput
          placeholder="Ej: Trabajo (Mañana), Comida, Trabajo (Tarde)..."
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            // Si el usuario aún no editó manualmente el grupo, sincronizarlo por defecto
            if (!initialBlock && !categoryKey) {
              setCategoryKey(e.target.value.toLowerCase().trim());
            }
          }}
        />
      </div>

      {/* 🔗 Grupo de Tareas Compartidas */}
      <div>
        <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
          🔗 Grupo de Tareas Compartidas:
        </label>
        <UITextInput
          placeholder="Ej: trabajo, limpieza, personal..."
          value={categoryKey}
          onChange={(e) => setCategoryKey(e.target.value)}
        />
        {existingGroups.length > 0 && (
          <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginTop: "6px" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Usar existente:</span>
            {existingGroups.map((group) => (
              <button
                key={group}
                type="button"
                onClick={() => setCategoryKey(group)}
                style={{
                  padding: "2px 6px",
                  borderRadius: "4px",
                  border: group === categoryKey.toLowerCase().trim() ? "1px solid var(--primary-color)" : "1px solid var(--border-color)",
                  background: group === categoryKey.toLowerCase().trim() ? "var(--primary-bg)" : "var(--surface)",
                  color: "var(--text-primary)",
                  fontSize: "0.75rem",
                  cursor: "pointer",
                }}
              >
                🏷️ {group}
              </button>
            ))}
          </div>
        )}
        <small style={{ color: "var(--text-secondary)", fontSize: "0.75rem", display: "block", marginTop: "4px" }}>
          💡 Bloques que usen el mismo grupo (ej: Trabajo Mañana y Trabajo Tarde) compartirán la misma lista de tareas.
        </small>
      </div>

      {/* ⏱️ Horario */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
        <div>
          <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
            Hora Inicio:
          </label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            style={{
              width: "100%",
              padding: "0.5rem",
              borderRadius: "8px",
              border: "1px solid var(--input-border-color)",
              backgroundColor: "var(--input-bg)",
              color: "var(--text-primary)",
            }}
          />
        </div>
        <div>
          <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
            Hora Fin:
          </label>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            style={{
              width: "100%",
              padding: "0.5rem",
              borderRadius: "8px",
              border: "1px solid var(--input-border-color)",
              backgroundColor: "var(--input-bg)",
              color: "var(--text-primary)",
            }}
          />
        </div>
      </div>

      {/* 📅 Días de la semana */}
      <div>
        <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", display: "block", marginBottom: "6px" }}>
          Días activos:
        </label>
        <div style={{ display: "flex", gap: "6px" }}>
          {DAYS_MAP.map((day) => {
            const active = daysOfWeek.includes(day.id);
            return (
              <button
                key={day.id}
                type="button"
                onClick={() => toggleDay(day.id)}
                style={{
                  flex: 1,
                  padding: "6px 0",
                  borderRadius: "6px",
                  border: active ? `2px solid ${effectiveColor}` : "1px solid var(--border-color)",
                  backgroundColor: active ? effectiveColor : "var(--surface)",
                  color: active ? "#ffffff" : "var(--text-secondary)",
                  fontWeight: 700,
                  fontSize: "0.8rem",
                  cursor: "pointer",
                }}
              >
                {day.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 🎨 Selección de Color */}
      <div>
        <p style={{ marginBottom: "0.5rem", color: "var(--text-primary)", fontSize: "0.85rem" }}>
          🎨 Color del bloque:
        </p>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                setSelectedColor(c);
                setCustomColor("");
              }}
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                border: c === effectiveColor ? "2px solid var(--text-primary)" : "1px solid var(--border-color)",
                backgroundColor: c,
                cursor: "pointer",
              }}
            />
          ))}

          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <input
              type="color"
              value={customColor || selectedColor}
              onChange={(e) => setCustomColor(e.target.value)}
              style={{
                width: "36px",
                height: "32px",
                border: "none",
                background: "none",
                cursor: "pointer",
              }}
            />
            <small style={{ color: "var(--text-secondary)", fontSize: "0.75rem" }}>← Personalizado</small>
          </div>
        </div>
      </div>

      {/* 😃 Selección de Emoji */}
      <div>
        <p style={{ marginBottom: "0.5rem", color: "var(--text-primary)", fontSize: "0.85rem" }}>
          😃 Icono (emoji):
        </p>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
          {PRESET_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => {
                setSelectedEmoji(emoji);
                setCustomEmoji("");
              }}
              style={{
                fontSize: "1.3rem",
                padding: "0.2rem 0.6rem",
                borderRadius: "8px",
                border: emoji === effectiveEmoji ? "2px solid var(--text-primary)" : "1px solid var(--border-color)",
                background: "var(--surface)",
                cursor: "pointer",
              }}
            >
              {emoji}
            </button>
          ))}

          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <UITextInput
              type="text"
              maxLength={2}
              placeholder="📝"
              value={customEmoji}
              onChange={(e) => setCustomEmoji(e.target.value)}
              style={{ width: "55px", textAlign: "center", fontSize: "1.2rem", padding: "0.2rem" }}
            />
            <small style={{ color: "var(--text-secondary)", fontSize: "0.75rem" }}>← Personalizado</small>
          </div>
        </div>
      </div>

      {/* ✔ Botones */}
      <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", marginTop: "0.5rem" }}>
        {initialBlock && onDelete ? (
          <UIButton variant="danger" onClick={onDelete}>
            Eliminar
          </UIButton>
        ) : <div />}

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <UIButton variant="default" onClick={onCancel}>
            Cancelar
          </UIButton>
          <UIButton variant="primary" onClick={handleSave}>
            Guardar
          </UIButton>
        </div>
      </div>
    </div>
  );
};

export default CreateEditBlockModal;
