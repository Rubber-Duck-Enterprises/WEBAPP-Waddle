// components/Modal/Presets/CreateTaskModal.tsx
import React, { useState } from "react";
import UITextInput from "../../UI/UITextInput";
import UITextArea from "../../UI/UITextArea";
import UIButton from "../../UI/UIButton";

type Props = {
  onConfirm: (task: { title: string; dueDate?: string; notes?: string }) => void;
  onCancel: () => void;
};

export const getCreateTaskModal = ({ onConfirm, onCancel }: Props) => {
  return <CreateTaskModal onConfirm={onConfirm} onCancel={onCancel} />;
};

const CreateTaskModal: React.FC<Props> = ({ onConfirm, onCancel }) => {
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");

  const isValid = title.trim().length > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <h3 style={{ color: "var(--text-primary)" }}>Agregar nueva tarea</h3>

      <UITextInput
        placeholder="Título de la tarea"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <UITextInput
        type="date"
        placeholder="Fecha límite (opcional)"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
      />

      <UITextArea
        placeholder="Notas (opcional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={3}
      />

      <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
        <UIButton onClick={onCancel} variant="default">
          Cancelar
        </UIButton>
        <UIButton
          onClick={() => {
            if (isValid) {
              onConfirm({
                title: title.trim(),
                dueDate: dueDate || undefined,
                notes: notes.trim() || undefined,
              });
            }
          }}
          disabled={!isValid}
          variant="primary"
        >
          Crear
        </UIButton>
      </div>
    </div>
  );
};

export default CreateTaskModal;
