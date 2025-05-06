import React, { useState } from "react";
import { Task } from "../../../types";
import { useTaskListStore } from "../../../stores/TaskListStore";
import UITextInput from "../../UI/UITextInput";
import UITextArea from "../../UI/UITextArea";
import UISelect from "../../UI/UISelect";
import UIButton from "../../UI/UIButton";

type Props = {
  activeListId: string | "all";
  task: Task;
  onConfirm: (updatedTask: Partial<Task>) => void;
  onDelete: () => void;
  onCancel: () => void;
};

export const getEditTaskModal = (props: Props) => <EditTaskModal {...props} />;

const EditTaskModal: React.FC<Props> = ({ activeListId, task, onConfirm, onDelete, onCancel }) => {
  const { taskLists } = useTaskListStore();
  const [title, setTitle] = useState(task.title || "");
  const [dueDate, setDueDate] = useState(task.dueDate || "");
  const [notes, setNotes] = useState(task.notes || "");
  const [priority, setPriority] = useState(task.priority || "medium");
  const [repeat, setRepeat] = useState<"daily" | "weekly" | "monthly" | null | undefined>(task.repeat || null);
  const [tags, setTags] = useState((task.tags || []).join(", "));
  const [selectedListId, setSelectedListId] = useState(task.listId || "");

  const isValid = title.trim().length > 0 && (activeListId !== "all" || selectedListId);
  const finalListId = activeListId === "all" ? selectedListId : activeListId;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <h3 style={{ color: "var(--text-primary)" }}>Editar tarea</h3>

      <UITextInput
        placeholder="Título de la tarea"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <UITextInput
        type="date"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
      />

      <UITextArea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notas"
        rows={3}
      />

      <UISelect value={priority} onChange={(e) => setPriority(e.target.value as any)}>
        <option value="low">Prioridad baja</option>
        <option value="medium">Prioridad media</option>
        <option value="high">Prioridad alta</option>
      </UISelect>

      <UISelect value={repeat || ""} onChange={(e) => setRepeat(e.target.value as any)}>
        <option value="">No repetir</option>
        <option value="daily">Repetir diario</option>
        <option value="weekly">Repetir semanal</option>
        <option value="monthly">Repetir mensual</option>
      </UISelect>

      <UITextInput
        placeholder="Etiquetas separadas por coma"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
      />

      {activeListId === "all" && (
        <UISelect value={selectedListId} onChange={(e) => setSelectedListId(e.target.value)}>
          <option value="" disabled>Selecciona una lista</option>
          {taskLists.map((l) => (
            <option key={l.id} value={l.id}>
              {l.icon} {l.name}
            </option>
          ))}
        </UISelect>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1rem" }}>
        <UIButton onClick={onDelete} variant="danger">
          Eliminar
        </UIButton>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <UIButton onClick={onCancel} variant="default">Cancelar</UIButton>
          <UIButton
            variant="primary"
            disabled={!isValid}
            onClick={() => {
              if (isValid) {
                onConfirm({
                  title: title.trim(),
                  dueDate: dueDate || undefined,
                  notes: notes.trim() || undefined,
                  listId: finalListId,
                  priority,
                  repeat: repeat,
                  tags: tags.split(",").map(t => t.trim()).filter(Boolean),
                });
              }
            }}
          >
            Guardar
          </UIButton>
        </div>
      </div>
    </div>
  );
};

export default EditTaskModal;
