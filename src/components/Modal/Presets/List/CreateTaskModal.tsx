import React, { useState, useEffect } from "react";
import { nanoid } from "nanoid";

import UITextInput from "@/components/UI/UITextInput";
import UITextArea from "@/components/UI/UITextArea";
import UISelect from "@/components/UI/UISelect";
import UIButton from "@/components/UI/UIButton";

import { useTaskListStore } from "@/stores/TaskListStore";

type Props = {
  activeListId: string | "all";
  onConfirm: (task: {
    title: string;
    dueDate?: string;
    notes?: string;
    listId?: string;
    priority?: "low" | "medium" | "high";
    repeat?: "daily" | "weekly" | "monthly" | null;
    tags?: string[];
  }) => void;
  onCancel: () => void;
};

export const getCreateTaskModal = ({ activeListId, onConfirm, onCancel }: Props) => {
  return <CreateTaskModal activeListId={activeListId} onConfirm={onConfirm} onCancel={onCancel} />;
};

const CreateTaskModal: React.FC<Props> = ({ activeListId, onConfirm, onCancel }) => {
  const { taskLists, addTagToList, getTagsForList, addTaskList } = useTaskListStore();
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [repeat, setRepeat] = useState<"daily" | "weekly" | "monthly" | "">("");
  const [tags, setTags] = useState("");
  const [selectedListId, setSelectedListId] = useState("");

  const isValid = title.trim().length > 0 && (activeListId !== "all" || selectedListId);
  const finalListId = activeListId === "all" ? selectedListId : activeListId;
  const suggestedTags = getTagsForList(finalListId);

  // Asegura que exista al menos una lista ("General")
  useEffect(() => {
    const alreadyExists = taskLists.some((l) => l.name.toLowerCase() === "general");

    if (taskLists.length === 0 || !alreadyExists) {
      const generalList = {
        id: nanoid(),
        name: "General",
        color: "#2196f3",
        icon: "📋",
        createdAt: Date.now(),
      };
      addTaskList(generalList);
    }
  }, []);

  useEffect(() => {
    if (taskLists.length === 1 && activeListId === "all") {
      setSelectedListId(taskLists[0].id);
    }
  }, [taskLists, activeListId]);

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

      {/* Prioridad */}
      <UISelect
        value={priority}
        onChange={(e) => setPriority(e.target.value as "low" | "medium" | "high")}
      >
        <option value="low">Prioridad baja</option>
        <option value="medium">Prioridad media</option>
        <option value="high">Prioridad alta</option>
      </UISelect>

      {/* Repetición */}
      <UISelect
        value={repeat}
        onChange={(e) => setRepeat(e.target.value as "daily" | "weekly" | "monthly" | "")}
      >
        <option value="">No repetir</option>
        <option value="daily">Repetir diario</option>
        <option value="weekly">Repetir semanal</option>
        <option value="monthly">Repetir mensual</option>
      </UISelect>

      {/* Tags */}
      <UITextInput
        placeholder="Etiquetas separadas por coma (ej. trabajo, urgente)"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        list="tag-suggestions"
      />
      <datalist id="tag-suggestions">
        {suggestedTags.map((tag) => (
          <option key={tag.id} value={tag.name} />
        ))}
      </datalist>

      {/* Selector de lista si está en "Todas" */}
      {activeListId === "all" && (
        <UISelect value={selectedListId} onChange={(e) => setSelectedListId(e.target.value)}>
          <option value="" disabled>Selecciona una lista</option>
          {taskLists.map((l) => (
            <option key={l.id} value={l.id}>
              {l.icon || "📋"} {l.name}
            </option>
          ))}
        </UISelect>
      )}

      {/* Botones */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
        <UIButton onClick={onCancel} variant="default">Cancelar</UIButton>
        <UIButton
          onClick={() => {
            if (isValid) {
              const parsedTags = tags
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean);

              parsedTags.forEach((name) => {
                addTagToList(finalListId, { id: nanoid(), name });
              });

              onConfirm({
                title: title.trim(),
                dueDate: dueDate || undefined,
                notes: notes.trim() || undefined,
                listId: finalListId,
                priority,
                repeat: repeat || null,
                tags: parsedTags,
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
