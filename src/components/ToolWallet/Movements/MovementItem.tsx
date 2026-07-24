import React from "react";
import UIButton from "@/components/UI/UIButton";
import { Expense, Section } from "@/types";
import styles from "./Movements.module.css";

interface Props {
  expense: Expense;
  section?: Section;
  onDelete: (id: string) => void;
  onEdit: (expense: Expense) => void;
}

const MovementItem: React.FC<Props> = React.memo(({ expense, section, onDelete, onEdit }) => {
  const isExpense = expense.amount < 0;

  return (
    <li className={`${styles.movementItem} ${isExpense ? styles.movementItemExpense : styles.movementItemIncome}`}>
      <strong className={styles.movementDescription}>{expense.description}</strong>

      <span
        className={styles.movementAmount}
        style={{ color: isExpense ? "var(--danger-color)" : "var(--success-color)" }}
      >
        {isExpense ? "-" : "+"}${Math.abs(expense.amount).toLocaleString()}
      </span>

      <small className={styles.movementMeta}>
        {new Date(expense.date).toLocaleDateString()} ·{" "}
        {section ? `${section.icon || "📁"} ${section.name}` : "General"}
      </small>

      <div className={styles.movementActions}>
        <UIButton variant="secondary" onClick={() => onEdit(expense)}>
          Editar
        </UIButton>
        <UIButton variant="danger" onClick={() => onDelete(expense.id)}>
          Eliminar
        </UIButton>
      </div>
    </li>
  );
});

MovementItem.displayName = "MovementItem";

export default MovementItem;
