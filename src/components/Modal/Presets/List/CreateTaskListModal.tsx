// components/Modal/Presets/CreateTaskListModal.tsx
import React, { useState } from "react";
import UITextInput from "@/components/UI/UITextInput";
import UIButton from "@/components/UI/UIButton";

type Props = {
  onConfirm: (config: { name: string; color: string; icon: string }) => void;
  onCancel: () => void;
};

export const getCreateTaskListModal = ({ onConfirm, onCancel }: Props) => {
  return <CreateTaskListModal onConfirm={onConfirm} onCancel={onCancel} />;
};

const CreateTaskListModal: React.FC<Props> = ({ onConfirm, onCancel }) => {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#2196f3");
  const [icon, setIcon] = useState("✅");
  const [customColor, setCustomColor] = useState("");
  const [customEmoji, setCustomEmoji] = useState("");

  const colorOptions = ["#2196f3", "#4caf50", "#e91e63", "#ff9800", "#9c27b0"];
  const emojiOptions = ["✅", "📋", "📝", "🎯", "🗓️", "💼", "🔖"];

  const effectiveColor = customColor || color;
  const effectiveEmoji = customEmoji || icon;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <h3 style={{ color: "var(--text-primary)" }}>Crear nueva lista</h3>
      
      {/* 📝 Nombre de la lista */}
      <UITextInput
        placeholder="Nombre de la lista"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      {/* 🎨 Color */}
      <div>
        <p style={{ marginBottom: "0.5rem", color: "var(--text-primary)" }}>🎨 Color de la lista:</p>
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
          placeholder="📝"
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
          onClick={() => {
            if (name.trim()) {
              onConfirm({ name: name.trim(), color: effectiveColor, icon: effectiveEmoji });
            }
          }}
          disabled={!name.trim()}
          variant="primary"
        >
          Crear
        </UIButton>
      </div>
    </div>
  );
};

export default CreateTaskListModal;
