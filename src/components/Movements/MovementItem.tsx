import React from "react";
import UIButton from "../UI/UIButton";
import { Expense, Section } from "../../types";

interface Props {
  expense: Expense;
  section?: Section;
  onDelete: (id: string) => void;
  onEdit: (expense: Expense) => void;
}

const MovementItem: React.FC<Props> = ({ expense, section, onDelete, onEdit }) => {
  const isExpense = expense.amount < 0;
  const color = isExpense ? "#f44336" : "#4caf50";

  return (
    <li
      style={{
        marginBottom: "1rem",
        padding: "1rem",
        border: `1px solid ${color}`,
        borderRadius: "8px",
        backgroundColor: `${color}1A`, // color con transparencia
        boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
        display: "flex",
        flexDirection: "column",
        gap: "0.25rem",
      }}
    >
      <strong>{expense.description}</strong>

      <span style={{ color }}>
        {isExpense ? "-" : "+"}${Math.abs(expense.amount).toLocaleString()}
      </span>

      <small>
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
