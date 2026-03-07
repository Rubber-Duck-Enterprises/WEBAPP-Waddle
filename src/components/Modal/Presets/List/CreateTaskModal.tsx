import React, { useState, useEffect, useRef } from "react";
import { nanoid } from "nanoid";

import { Task } from "@/types/index"
import UITextInput from "@/components/UI/UITextInput";
import UITextArea from "@/components/UI/UITextArea";
import UISelect from "@/components/UI/UISelect";
import UIButton from "@/components/UI/UIButton";

import { useListStore } from "@/stores/listStore";
import { useModal } from "@/context/ModalContext";
import { usePopUp } from "@/context/PopUpContext";

type Props = {
  activeListId: string | "all";
  onConfirm: (task: Partial<Task>) => void;
  onCancel: () => void;
};

export const getCreateTaskModal = ({ activeListId, onConfirm, onCancel }: Props) => {
  return <CreateTaskModal activeListId={activeListId} onConfirm={onConfirm} onCancel={onCancel} />;
};

const CreateTaskModal: React.FC<Props> = ({ activeListId, onConfirm, onCancel }) => {
  const { taskLists, addTagToList, getTagsForList, addTaskList } = useListStore();
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState("");
  const [selectedListId, setSelectedListId] = useState("");
  const [isCreatingMore, setIsCreatingMore] = useState(false);

  const finalListId = activeListId === "all" ? selectedListId.trim() : activeListId;
  const suggestedTags = getTagsForList(finalListId);
  const initializedRef = useRef(false);

  const { hideModal } = useModal();
  const { showPopUp } = usePopUp();

  const onToggleMore = () => { setIsCreatingMore(!isCreatingMore) }

  const resetTaskData = () => {
    setTitle("");
    setNotes("");
    setTags("");
  }

  useEffect(() => {
    if (initializedRef.current) return;

    const alreadyExists = taskLists.some((l) => l.name.toLowerCase() === "general");
    if (!alreadyExists && taskLists.length <= 0) {
      const generalList = {
        id: nanoid(),
        name: "General",
        color: "#2196f3",
        icon: "📋",
        createdAt: Date.now(),
      };
      addTaskList(generalList);
    }

    initializedRef.current = true;
  }, [taskLists, addTaskList]);

  useEffect(() => {
    if (taskLists.length === 1 && activeListId === "all") {
      setSelectedListId(taskLists[0].id);
    }
  }, [taskLists, activeListId]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <h3 style={{ color: "var(--text-primary)" }}>⭐ Agregar tarea</h3>

      <UITextInput
        placeholder="Título de la tarea"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <UITextArea
        placeholder="Notas (opcional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={3}
      />

      <UITextInput
        placeholder="Etiquetas"
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

      <div
        style={{
          alignItems: "center",
          display: "flex",
          justifyContent: "flex-end",
          gap: ".5rem",
          marginBottom: ".5rem",
        }}
      >
        <label
          htmlFor="isCreatingMore"
        >
          Crear otra
        </label>
        <input
          id="isCreatingMore"
          style={{
            width: "18px",
            height: "18px",
            cursor: "pointer",
            accentColor: "var(--primary-color)",
            opacity: isCreatingMore ? "1" : ".5",
          }}
          type="checkbox" 
          checked={isCreatingMore} 
          onChange={onToggleMore} 
        />
      </div>

      {/* Botones */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
        <UIButton onClick={onCancel} variant="default">Cancelar</UIButton>
        <UIButton
          onClick={() => {
            const cleanTitle = title.trim();
            const cleanListId = finalListId?.trim();

            if (!cleanTitle) {
              showPopUp("DANGER", "Revisa el titulo de la tarea.");
              return
            };
            if (!cleanListId) {
              showPopUp("DANGER", "Selecciona una lista.");
              return
            }; 

            try {
              const parsedTags = tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean);

              parsedTags.forEach((name) => {
                addTagToList(finalListId, { id: nanoid(), name });
              });

              onConfirm({
                title: title.trim(),
                notes: notes.trim() || undefined,
                listId: finalListId,
                tags: parsedTags,
                createdAt: new Date().toISOString(),
              });

              resetTaskData();
              showPopUp("SUCCESS", "Tarea creada!");

              if (!isCreatingMore) { 
                hideModal();
              }
            } catch (error) {
              showPopUp("DANGER", "Error al crear tarea.");
              console.log("CreateTaskModal - Error al crear tarea", error);
            }
          }}
          variant="primary"
        >
          Crear
        </UIButton>
      </div>
    </div>
  );
};

export default CreateTaskModal;
