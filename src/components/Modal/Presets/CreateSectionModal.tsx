import React, { useState } from "react";
import UITextInput from "../../UI/UITextInput";
import UIButton from "../../UI/UIButton";

type Props = {
  name: string;
  onConfirm: (config: { goal: number; color: string; icon: string }) => void;
  onCancel: () => void;
};

export const getCreateSectionModal = ({ name, onConfirm, onCancel }: Props) => {
  return <CreateSectionModal name={name} onConfirm={onConfirm} onCancel={onCancel} />;
};

const CreateSectionModal: React.FC<Props> = ({ name, onConfirm, onCancel }) => {
  const [goal, setGoal] = useState<number | null>(null);
  const [color, setColor] = useState<string>("#FFD700");
  const [icon, setIcon] = useState<string>("💰");
  const [customColor, setCustomColor] = useState<string>("");
  const [customEmoji, setCustomEmoji] = useState<string>("");

  const colorOptions = ["#FFD700", "#4caf50", "#2196f3", "#e91e63", "#ff9800"];
  const emojiOptions = ["💰", "🏠", "🍔", "🎓", "✈️", "📦", "🎁"];

  const effectiveColor = customColor || color;
  const effectiveEmoji = customEmoji || icon;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem"}}>
      <h3 style={{ color: "var(--text-primary)" }}>Configurar nuevo apartado</h3>
      <p style={{ color: "var(--text-secondary)" }}>
        Nombre: <strong>{name}</strong>
      </p>

      {/* 🎯 Meta */}
      <UITextInput
        type="number"
        placeholder="Meta (opcional)"
        value={goal ?? ""}
        onChange={(e) => setGoal(Number(e.target.value))}
      />

      {/* 🎨 Color */}
      <div>
        <p style={{ marginBottom: "0.5rem", color: "var(--text-primary)" }}>🎨 Color del apartado:</p>
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
        <small style={{ marginLeft: "0.5rem", color: "var(--text-secondary)" }}>← Personalizado</small>
      </div>

      {/* 😃 Icono */}
      <div>
        <p style={{ marginBottom: "0.5rem", color: "var(--text-primary)" }}>😃 Icono (emoji):</p>
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
          style={{ width: "60px", textAlign: "center", fontSize: "1.5rem" }}
        />
        <small style={{ marginLeft: "0.5rem", color: "var(--text-secondary)" }}>← Personalizado</small>
      </div>

      {/* ✔ Botones */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
        <UIButton onClick={onCancel} variant="default">
          Cancelar
        </UIButton>
        <UIButton
          onClick={() =>
            onConfirm({
              goal: goal ?? 0,
              color: effectiveColor,
              icon: effectiveEmoji,
            })
          }
          variant="primary"
        >
          Crear
        </UIButton>
      </div>
    </div>
  );
};

export default CreateSectionModal;
