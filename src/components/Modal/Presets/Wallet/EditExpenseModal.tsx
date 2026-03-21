import React, { useState } from "react";
import { Expense, Section } from "@/types";
import UITextInput from "@/components/UI/UITextInput";
import UITextArea from "@/components/UI/UITextArea";
import UISelect from "@/components/UI/UISelect";
import UIButton from "@/components/UI/UIButton";
import { usePopUp } from "@/context/PopUpContext";

interface Props {
  expense: Expense;
  sections: Section[];
  onCancel: () => void;
  onConfirm: (updated: Omit<Expense, "id">) => void;
}

const EditExpenseModal: React.FC<Props> = ({ expense, sections, onCancel, onConfirm }) => {
  const { showPopUp } = usePopUp();
  const [description, setDescription] = useState(expense.description);
  const [amount, setAmount] = useState(
    expense.amount ? String(Math.abs(expense.amount)) : ""
  );
  const [notes, setNotes] = useState(expense.notes || "");
  const [category, setCategory] = useState(expense.category);
  const [type, setType] = useState<"income" | "expense">(expense.amount >= 0 ? "income" : "expense");
  const [date, setDate] = useState(expense.date.slice(0, 10)); // yyyy-MM-dd

  const handleSubmit = () => {
    try {
      if (!description.trim()) {
        showPopUp("DANGER", "Escribe una descripción.");
        return;
      }
      if (!amount || Number(amount) <= 0) {
        showPopUp("DANGER", "El monto debe ser mayor a 0.");
        return;
      }
      onConfirm({
        description,
        amount: type === "expense" ? -Math.abs(Number(amount)) : Math.abs(Number(amount)),
        notes,
        category,
        date: new Date(date).toISOString(),
      });
      showPopUp("SUCCESS", "Movimiento actualizado.");
    } catch (error) {
      showPopUp("DANGER", "Error al actualizar el movimiento.");
      console.error("EditExpenseModal - Error:", error);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <h3>✏️ Editar movimiento</h3>

      <UITextInput
        placeholder="Descripción"
        value={description}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)}
      />

      <UITextInput
        type="number"
        placeholder="Monto"
        value={amount}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setAmount(e.target.value)
        }
      />

      <UISelect
        value={type}
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setType(e.target.value as any)}
      >
        <option value="income">Ingreso</option>
        <option value="expense">Gasto</option>
      </UISelect>

      <UISelect
        value={category}
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCategory(e.target.value)}
      >
        <option value="general">General</option>
        {sections.map((s) => (
          <option key={s.id} value={s.id}>
            {s.icon || "📁"} {s.name}
          </option>
        ))}
      </UISelect>

      <UITextInput
        type="date"
        value={date}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDate(e.target.value)}
      />

      <UITextArea
        placeholder="Notas"
        value={notes}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
      />

      <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
        <UIButton onClick={onCancel} variant="default">
          Cancelar
        </UIButton>
        <UIButton onClick={handleSubmit} variant="secondary">
          Guardar
        </UIButton>
      </div>
    </div>
  );
};

export default EditExpenseModal;
