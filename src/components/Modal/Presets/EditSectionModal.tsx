import React, { useState } from "react";
import UITextInput from "../../UI/UITextInput";
import UIButton from "../../UI/UIButton";

type Props = {
  name: string;
  initialValues: {
    goal: number;
    color: string;
    icon: string;
  };
  onConfirm: (config: { goal: number; color: string; icon: string }) => void;
  onCancel: () => void;
};

export const getEditSectionModal = ({ name, initialValues, onConfirm, onCancel }: Props) => {
  return <EditSectionModal name={name} initialValues={initialValues} onConfirm={onConfirm} onCancel={onCancel} />;
};

const EditSectionModal: React.FC<Props> = ({ name, initialValues, onConfirm, onCancel }) => {
  const predefinedColors = ["#FFD700", "#4caf50", "#2196f3", "#e91e63", "#ff9800"];
  const predefinedEmojis = ["💰", "🏠", "🍔", "🎓", "✈️", "📦", "🎁"];

  const [goal, setGoal] = useState<number>(initialValues.goal);
  const [color, setColor] = useState<string>(
    predefinedColors.includes(initialValues.color) ? initialValues.color : "#FFD700"
  );
  const [customColor, setCustomColor] = useState<string>(
    predefinedColors.includes(initialValues.color) ? "" : initialValues.color
  );

  const [icon, setIcon] = useState<string>(
    predefinedEmojis.includes(initialValues.icon) ? initialValues.icon : "💰"
  );
  const [customEmoji, setCustomEmoji] = useState<string>(
    predefinedEmojis.includes(initialValues.icon) ? "" : initialValues.icon
  );

  const effectiveColor = customColor || color;
  const effectiveEmoji = customEmoji || icon;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <h3>Editar apartado</h3>
      <p>Nombre: <strong>{name}</strong></p>

      {/* 🎯 Meta */}
      <div>
        <label style={{ display: "block", marginBottom: "0.3rem" }}>🎯 Meta (opcional):</label>
        <UITextInput
          type="number"
          value={goal}
          onChange={(e) => setGoal(Number(e.target.value))}
          placeholder="0"
        />
      </div>

      {/* 🎨 Color */}
      <div>
        <p style={{ marginBottom: "0.5rem" }}>🎨 Color del apartado:</p>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {predefinedColors.map((c) => (
            <button
              key={c}
              onClick={() => {
                setColor(c);
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
        </div>
        <input
          type="color"
          value={customColor || color}
          onChange={(e) => setCustomColor(e.target.value)}
          style={{
            marginTop: "0.5rem",
            width: "48px",
            height: "32px",
            border: "none",
            background: "none",
            cursor: "pointer",
          }}
        />
        <small style={{ marginLeft: "0.5rem" }}>← Personalizado</small>
      </div>

      {/* 😃 Emoji */}
      <div>
        <p style={{ marginBottom: "0.5rem" }}>😃 Icono (emoji):</p>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {predefinedEmojis.map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                setIcon(emoji);
                setCustomEmoji("");
              }}
              style={{
                fontSize: "1.4rem",
                padding: "0.2rem 0.5rem",
                borderRadius: "8px",
                border: emoji === effectiveEmoji ? "2px solid var(--text-primary)" : "1px solid var(--border-color)",
                background: "var(--background)",
                cursor: "pointer",
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
        <UITextInput
          type="text"
          maxLength={2}
          placeholder="🎨"
          value={customEmoji}
          onChange={(e) => setCustomEmoji(e.target.value)}
          style={{
            marginTop: "0.5rem",
            width: "60px",
            textAlign: "center",
            fontSize: "1.5rem",
          }}
        />
        <small style={{ marginLeft: "0.5rem" }}>← Personalizado</small>
      </div>

      {/* Botones */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
        <UIButton onClick={onCancel} variant="default">
          Cancelar
        </UIButton>
        <UIButton
          onClick={() =>
            onConfirm({
              goal,
              color: effectiveColor,
              icon: effectiveEmoji,
            })
          }
          variant="primary"
        >
          Guardar
        </UIButton>
      </div>
    </div>
  );
};

export default EditSectionModal;
