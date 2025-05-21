import React, { useState } from "react";
import { FiPlus } from "react-icons/fi";

import UITextInput from "../../UI/UITextInput";
import UIButton from "../../UI/UIButton";
import UISelect from "../../UI/UISelect";

import { useSettingsStore } from "../../../stores/settingsStore";
import { CardMode, SectionType } from "../../../types";

type Props = {
  name: string;
  initialValues: {
    goal: number;
    color: string;
    icon: string;
    type: SectionType;
    cardSettings?: {
      mode: CardMode;
      cutoffDate?: string;
      paymentDate?: string;
    };
  };
  onConfirm: (config: {
    goal: number;
    color: string;
    icon: string;
    cardSettings?: {
      mode: CardMode;
      cutoffDate?: string;
      paymentDate?: string;
    };
  }) => void;
  onCancel: () => void;
};

export const getEditSectionModal = ({ name, initialValues, onConfirm, onCancel }: Props) => {
  return <EditSectionModal name={name} initialValues={initialValues} onConfirm={onConfirm} onCancel={onCancel} />;
};

const EditSectionModal: React.FC<Props> = ({ name, initialValues, onConfirm, onCancel }) => {
  const { favouriteColors, favouriteEmojis } = useSettingsStore();

  const [goal, setGoal] = useState<number>(initialValues.goal);
  const [color, setColor] = useState<string>(
    favouriteColors.includes(initialValues.color) ? initialValues.color : favouriteColors[0] || "#FFD700"
  );
  const [customColor, setCustomColor] = useState<string>(
    favouriteColors.includes(initialValues.color) ? "" : initialValues.color
  );

  const [icon, setIcon] = useState<string>(
    favouriteEmojis.includes(initialValues.icon) ? initialValues.icon : favouriteEmojis[0] || "💰"
  );
  const [customEmoji, setCustomEmoji] = useState<string>(
    favouriteEmojis.includes(initialValues.icon) ? "" : initialValues.icon
  );

  const [cardMode, setCardMode] = useState<CardMode>(initialValues.cardSettings?.mode || "debit");
  const [cutoffDate, setCutoffDate] = useState<string>(initialValues.cardSettings?.cutoffDate || "");
  const [paymentDate, setPaymentDate] = useState<string>(initialValues.cardSettings?.paymentDate || "");

  const effectiveColor = customColor || color;
  const effectiveEmoji = customEmoji || icon;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <h3 style={{ color: "var(--text-primary)" }}>Editar apartado</h3>
      <p style={{ color: "var(--text-secondary)" }}>
        Nombre: <strong>{name}</strong>
      </p>
      <p style={{ color: "var(--text-secondary)" }}>
        Tipo: <strong>{getSectionTypeLabel(initialValues.type)}</strong>
      </p>

      {initialValues.type === "savings" && (
        <>
          <UITextInput
            type="number"
            placeholder="Meta de ahorro"
            value={goal ?? ""}
            onChange={(e) => setGoal(Number(e.target.value))}
            min={1}
          />
          {(!goal || goal <= 0) && (
            <small style={{ color: "var(--danger)" }}>
              La meta de ahorro es obligatoria para este tipo.
            </small>
          )}
        </>
      )}

      {initialValues.type === "card" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <UISelect value={cardMode} onChange={(e) => setCardMode(e.target.value as CardMode)}>
            <option value="debit">Débito</option>
            <option value="credit">Crédito</option>
            <option value="both">Ambos</option>
          </UISelect>

          {(cardMode === "credit" || cardMode === "both") && (
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <UITextInput
                type="number"
                min={1}
                max={31}
                placeholder="Día corte"
                value={cutoffDate}
                onChange={(e) => setCutoffDate(e.target.value)}
                style={{ flex: 1 }}
              />
              <UITextInput
                type="number"
                min={1}
                max={31}
                placeholder="Día pago"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                style={{ flex: 1 }}
              />
            </div>
          )}
        </div>
      )}

      {/* Icono */}
      <div>
        <p style={{ marginBottom: "0.5rem", color: "var(--text-primary)" }}>😃 Icono:</p>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div style={{ display: "flex", gap: "0.5rem", overflowX: "auto", flex: 1 }}>
            {favouriteEmojis.map((emoji) => (
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
                  border: emoji === (customEmoji || icon)
                    ? "2px solid var(--text-primary)"
                    : "1px solid var(--border-color)",
                  background: "var(--background)",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
        <UITextInput
          type="text"
          maxLength={2}
          placeholder="🔣"
          value={customEmoji}
          onChange={(e) => setCustomEmoji(e.target.value)}
          style={{
            width: "60px",
            textAlign: "center",
            fontSize: "1.5rem",
            marginTop: "0.5rem",
          }}
        />
      </div>

      {/* Color */}
      <div>
        <p style={{ marginBottom: "0.5rem", color: "var(--text-primary)" }}>🎨 Color:</p>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div style={{ display: "flex", gap: "0.5rem", overflowX: "auto", flex: 1 }}>
            {favouriteColors.map((c) => (
              <button
                key={c}
                onClick={() => {
                  setColor(c);
                  setCustomColor("");
                }}
                style={{
                  minWidth: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  border: c === (customColor || color)
                    ? "2px solid var(--text-primary)"
                    : "1px solid var(--border-color)",
                  backgroundColor: c,
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              />
            ))}
          </div>

          <div
            style={{
              position: "relative",
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              overflow: "hidden",
              flexShrink: 0,
            }}
          >
            <input
              type="color"
              value={customColor || "#ffd600"}
              onChange={(e) => setCustomColor(e.target.value)}
              style={{
                width: "100%",
                height: "100%",
                border: "none",
                borderRadius: "50%",
                appearance: "none",
                background: "transparent",
                cursor: "pointer",
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                pointerEvents: "none",
              }}
            >
              <FiPlus size={16} />
            </div>
          </div>
        </div>
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
              cardSettings:
                initialValues.type === "card"
                  ? {
                      mode: cardMode,
                      cutoffDate,
                      paymentDate,
                    }
                  : undefined,
            })
          }
          variant="primary"
          disabled={initialValues.type === "savings" && (!goal || goal <= 0)}
        >
          Guardar
        </UIButton>
      </div>
    </div>
  );
};

function getSectionTypeLabel(type: SectionType): string {
  switch (type) {
    case "standard":
      return "Estándar";
    case "passive":
      return "Pasivo";
    case "card":
      return "Tarjeta";
    case "savings":
      return "Ahorro";
    default:
      return "Desconocido";
  }
}

export default EditSectionModal;
