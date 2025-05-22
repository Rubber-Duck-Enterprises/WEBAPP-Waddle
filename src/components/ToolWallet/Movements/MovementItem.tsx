import React from "react";
import UIButton from "@/components/UI/UIButton";
import { Expense, Section } from "@/types";

interface Props {
  expense: Expense;
  section?: Section;
  onDelete: (id: string) => void;
  onEdit: (expense: Expense) => void;
}

const MovementItem: React.FC<Props> = ({ expense, section, onDelete, onEdit }) => {
  const isExpense = expense.amount < 0;
  const colorVar = isExpense ? "var(--danger-color)" : "var(--success-color)";
  const bgVar = isExpense ? "var(--danger-bg)" : "var(--success-bg)";

  return (
    <li
      style={{
        marginBottom: "1rem",
        padding: "1rem",
        border: `1px solid ${colorVar}`,
        borderRadius: "8px",
        backgroundColor: bgVar,
        boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
        display: "flex",
        flexDirection: "column",
        gap: "0.25rem",
      }}
    >
      <strong>{expense.description}</strong>

      <span style={{ color: colorVar }}>
        {isExpense ? "-" : "+"}${Math.abs(expense.amount).toLocaleString()}
      </span>

      <small style={{ color: "var(--text-secondary)" }}>
        {new Date(expense.date).toLocaleDateString()} ·{" "}
        {section ? `${section.icon || "📁"} ${section.name}` : "General"}
      </small>

      <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
        <UIButton variant="secondary" onClick={() => onEdit(expense)}>
          Editar
        </UIButton>
        <UIButton variant="danger" onClick={() => onDelete(expense.id)}>
          Eliminar
        </UIButton>
      </div>
    </li>
  );
};

export default MovementItem;
