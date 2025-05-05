import React, { useState } from "react";

type Props = {
  name: string;
  onConfirm: (config: { goal: number; color: string; icon: string }) => void;
  onCancel: () => void;
};

export const getCreateSectionModal = ({ name, onConfirm, onCancel }: Props) => {
  return <CreateSectionModal name={name} onConfirm={onConfirm} onCancel={onCancel} />;
};

const CreateSectionModal: React.FC<Props> = ({ name, onConfirm, onCancel }) => {
  const [goal, setGoal] = useState<number>(0);
  const [color, setColor] = useState<string>("#FFD700");
  const [icon, setIcon] = useState<string>("💰");
  const [customColor, setCustomColor] = useState<string>("");
  const [customEmoji, setCustomEmoji] = useState<string>("");

  const colorOptions = ["#FFD700", "#4caf50", "#2196f3", "#e91e63", "#ff9800"];
  const emojiOptions = ["💰", "🏠", "🍔", "🎓", "✈️", "📦", "🎁"];

  const effectiveColor = customColor || color;
  const effectiveEmoji = customEmoji || icon;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <h3>Configurar nuevo apartado</h3>
      <p>Nombre: <strong>{name}</strong></p>

      {/* 🎯 Meta */}
      <label>
        🎯 Meta (opcional):
        <input
          type="number"
          value={goal}
          onChange={(e) => setGoal(Number(e.target.value))}
          placeholder="0"
          style={{
            marginTop: "0.3rem",
            width: "100%",
            padding: "0.4rem",
            borderRadius: "8px",
            border: "1px solid #ccc",
          }}
        />
      </label>

      {/* 🎨 Color */}
      <div>
        <p style={{ marginBottom: "0.5rem" }}>🎨 Color del apartado:</p>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {colorOptions.map((c) => (
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
                border: c === effectiveColor ? "2px solid #000" : "1px solid #ccc",
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
          {emojiOptions.map((emoji) => (
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
                border: emoji === effectiveEmoji ? "2px solid #000" : "1px solid #ccc",
                background: "#fff",
                cursor: "pointer",
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
        <input
          type="text"
          maxLength={2}
          placeholder="🎨"
          value={customEmoji}
          onChange={(e) => {
            const value = e.target.value;
            if (value.length <= 2) setCustomEmoji(value);
          }}
          style={{
            marginTop: "0.5rem",
            padding: "0.4rem",
            borderRadius: "8px",
            border: "1px solid #ccc",
            width: "60px",
            textAlign: "center",
            fontSize: "1.5rem",
          }}
        />
        <small style={{ marginLeft: "0.5rem" }}>← Personalizado</small>
      </div>

      {/* ✔ Botones */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
        <button
          onClick={onCancel}
          style={{
            padding: "0.4rem 1rem",
            background: "#eee",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          Cancelar
        </button>
        <button
          onClick={() =>
            onConfirm({
              goal,
              color: effectiveColor,
              icon: effectiveEmoji,
            })
          }
          style={{
            padding: "0.4rem 1rem",
            background: "#4caf50",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          Crear
        </button>
      </div>
    </div>
  );
};
