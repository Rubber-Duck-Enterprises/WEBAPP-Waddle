import React, { useState } from "react";
import { FiPlus } from "react-icons/fi";

import UITextInput from "../../UI/UITextInput";
import UIButton from "../../UI/UIButton";
import UISelect from "../../UI/UISelect";

import { useSettingsStore } from "../../../stores/settingsStore";

import {
  Section,
  SectionType,
  CardMode,
} from "../../../types";

type Props = {
  name: string;
  onConfirm: (config: {
    goal: number;
    color: string;
    icon: string;
    type: SectionType;
    cardSettings?: Section["cardSettings"];
  }) => void;
  onCancel: () => void;
  goToSettings: () => void;
};

export const getCreateSectionModal = ({ name, onConfirm, onCancel, goToSettings }: Props) => {
  return <CreateSectionModal name={name} onConfirm={onConfirm} onCancel={onCancel} goToSettings={goToSettings} />;
};

const CreateSectionModal: React.FC<Props> = ({ name, onConfirm, onCancel, goToSettings }) => {
  const { favouriteColors, favouriteEmojis } = useSettingsStore();

  const [goal, setGoal] = useState<number | null>(null);
  const [color, setColor] = useState<string>(favouriteColors[0] || "#FFD700");
  const [icon, setIcon] = useState<string>(favouriteEmojis[0] || "💰");
  const [customColor, setCustomColor] = useState<string>("");
  const [customEmoji, setCustomEmoji] = useState<string>("");
  const [type, setType] = useState<SectionType>("standard");
  const [cardMode, setCardMode] = useState<CardMode>("debit");
  const [cutoffDate, setCutoffDate] = useState<string>("");
  const [paymentDate, setPaymentDate] = useState<string>("");

  const effectiveColor = customColor || color;
  const effectiveEmoji = customEmoji || icon;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <h3 style={{ color: "var(--text-primary)" }}>Configurar nuevo apartado</h3>
      <p style={{ color: "var(--text-secondary)" }}>
        Nombre: <strong>{name}</strong>
      </p>

      {/* Tipo */}
      <UISelect value={type} onChange={(e) => setType(e.target.value as SectionType)}>
        <option value="standard">Estándar</option>
        <option value="passive">Pasivo (solo gastos)</option>
        <option value="card">Tarjeta</option>
        <option value="savings">Ahorro</option>
      </UISelect>

      {/* Meta ahorro */}
      {type === "savings" && (
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

      {/* Configuración tarjeta */}
      {type === "card" && (
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ marginBottom: "0.5rem", color: "var(--text-primary)" }}>😃 Icono:</p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {/* Lista de emojis scrollable */}
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              overflowX: "auto",
              paddingBottom: "0.25rem",
              flex: 1,
            }}
          >
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

          {/* Botón para ir a configuración */}
          <UIButton
            onClick={goToSettings}
            style={{ minWidth: "36px", minHeight: "36px", padding: 0 }}
            variant="secondary"
          >
            <FiPlus size={16} />
          </UIButton>
        </div>
      </div>

      {/* Color */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ marginBottom: "0.5rem", color: "var(--text-primary)" }}>🎨 Color:</p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {/* Lista con scroll */}
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              overflowX: "auto",
              flex: 1,
            }}
          >
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

          {/* Selector libre */}
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
              value={customColor || '#ffd600'}
              onChange={(e) => setCustomColor(e.target.value)}
              style={{
                width: "100%",
                height: "100%",
                border: "none",
                borderRadius: "50%",
                outline: "none",
                padding: 0,
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
                color: "black",
                fontSize: "1rem",
                fontWeight: "bold",
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
              goal: goal ?? 0,
              color: effectiveColor,
              icon: effectiveEmoji,
              type,
              cardSettings:
                type === "card"
                  ? {
                    mode: cardMode,
                    cutoffDate,
                    paymentDate,
                  }
                  : undefined,
            })
          }
          variant="primary"
          disabled={type === "savings" && (!goal || goal <= 0)}
        >
          Crear
        </UIButton>
      </div>
    </div>
  );
};

export default CreateSectionModal;
