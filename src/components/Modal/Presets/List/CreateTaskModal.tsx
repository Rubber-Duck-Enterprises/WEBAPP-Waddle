import React, { useState, useEffect, useRef } from "react";
import { nanoid } from "nanoid";
import { motion, AnimatePresence } from "framer-motion";
import { FiChevronDown } from "react-icons/fi";

import { Task } from "@/types/index";
import UITextInput from "@/components/UI/UITextInput";
import UITextArea from "@/components/UI/UITextArea";
import UISelect from "@/components/UI/UISelect";
import UIButton from "@/components/UI/UIButton";
import UITagInput from "@/components/UI/UITagInput";

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

const priorityOptions = [
  { value: undefined, label: "Sin", emoji: "⚪", color: "var(--btn-default-bg)" },
  { value: "low" as const, label: "Baja", emoji: "🟢", color: "#4caf50" },
  { value: "medium" as const, label: "Media", emoji: "🟡", color: "#f39c12" },
  { value: "high" as const, label: "Alta", emoji: "🔴", color: "#f44336" },
];

const repeatOptions = [
  { value: "", label: "No repetir", emoji: "➖" },
  { value: "daily", label: "Diario", emoji: "📅" },
  { value: "weekly", label: "Semanal", emoji: "📆" },
  { value: "monthly", label: "Mensual", emoji: "🗓️" },
];

const CreateTaskModal: React.FC<Props> = ({ activeListId, onConfirm, onCancel }) => {
  const { taskLists, addTagToList, getTagsForList, addTaskList } = useListStore();
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [selectedListId, setSelectedListId] = useState("");
  const [isCreatingMore, setIsCreatingMore] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Campos avanzados
  const [priority, setPriority] = useState<Task["priority"]>(undefined);
  const [dueDate, setDueDate] = useState("");
  const [repeat, setRepeat] = useState<Task["repeat"]>(null);
  const [subtaskTitles, setSubtaskTitles] = useState<string[]>([]);
  const [newSubtask, setNewSubtask] = useState("");

  const finalListId = activeListId === "all" ? selectedListId.trim() : activeListId;
  const suggestedTags = getTagsForList(finalListId).map((t) => t.name);
  const initializedRef = useRef(false);

  const { hideModal } = useModal();
  const { showPopUp } = usePopUp();

  const onToggleMore = () => { setIsCreatingMore(!isCreatingMore); };

  const resetTaskData = () => {
    setTitle("");
    setNotes("");
    setTags([]);
    setPriority(undefined);
    setDueDate("");
    setRepeat(null);
    setShowAdvanced(false);
    setSubtaskTitles([]);
    setNewSubtask("");
  };

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

  // Resumen visual de opciones avanzadas configuradas
  const advancedSummary = [
    priority && `${priorityOptions.find(o => o.value === priority)?.emoji} ${priorityOptions.find(o => o.value === priority)?.label}`,
    dueDate && `📅 ${new Date(dueDate).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}`,
    repeat && `${repeatOptions.find(o => o.value === repeat)?.emoji} ${repeatOptions.find(o => o.value === repeat)?.label}`,
  ].filter(Boolean);

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

      {/* Tags con sistema de chips */}
      <UITagInput
        tags={tags}
        onChange={setTags}
        suggestions={suggestedTags}
        placeholder="Agregar etiqueta..."
      />

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

      {/* Toggle opciones avanzadas */}
      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          background: "var(--surface)",
          border: "1px solid var(--border-color)",
          borderRadius: "8px",
          padding: "0.6rem 0.8rem",
          cursor: "pointer",
          width: "100%",
          textAlign: "left",
        }}
      >
        <motion.span
          animate={{ rotate: showAdvanced ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          style={{ display: "inline-flex", alignItems: "center", color: "var(--text-secondary)" }}
        >
          <FiChevronDown size={16} />
        </motion.span>
        <span style={{ flex: 1, fontSize: "0.85rem", color: "var(--text-primary)", fontWeight: "500" }}>
          Más opciones
        </span>
        {/* Mini resumen de opciones ya configuradas */}
        {!showAdvanced && advancedSummary.length > 0 && (
          <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
            {advancedSummary.join(" · ")}
          </span>
        )}
      </button>

      {/* Panel de opciones avanzadas con animación */}
      <AnimatePresence initial={false}>
        {showAdvanced && (
          <motion.div
            key="advanced-options"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
                padding: "0.75rem",
                backgroundColor: "var(--surface)",
                borderRadius: "8px",
                border: "1px solid var(--border-color)",
              }}
            >
              {/* Prioridad */}
              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.4rem", display: "block", fontWeight: "600" }}>
                  🎯 Prioridad
                </label>
                <div style={{ display: "flex", gap: "0.35rem", overflowX: "auto", paddingBottom: "0.25rem", paddingLeft: "0.15rem", paddingRight: "0.15rem" }}>
                  {priorityOptions.map((opt) => (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => setPriority(opt.value)}
                      style={{
                        padding: "0.4rem 0.7rem",
                        borderRadius: "999px",
                        border: priority === opt.value
                          ? `2px solid ${opt.color}`
                          : "1px solid var(--border-color)",
                        backgroundColor: priority === opt.value
                          ? `${opt.color}20`
                          : "var(--background)",
                        color: "var(--text-primary)",
                        fontSize: "0.8rem",
                        fontWeight: priority === opt.value ? "700" : "normal",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        transform: priority === opt.value ? "scale(1.05)" : "scale(1)",
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                      }}
                    >
                      {opt.emoji} {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fecha de vencimiento */}
              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.4rem", display: "block", fontWeight: "600" }}>
                  📅 Fecha de vencimiento
                </label>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <UITextInput
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  {dueDate && (
                    <button
                      type="button"
                      onClick={() => setDueDate("")}
                      style={{
                        background: "var(--danger-bg)",
                        border: "1px solid var(--danger-color)",
                        borderRadius: "6px",
                        padding: "0.35rem 0.5rem",
                        cursor: "pointer",
                        fontSize: "0.75rem",
                        color: "var(--danger-color)",
                        fontWeight: "600",
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Recurrencia */}
              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.4rem", display: "block", fontWeight: "600" }}>
                  🔄 Repetir
                </label>
                <div style={{ display: "flex", gap: "0.35rem", overflowX: "auto", paddingBottom: "0.25rem", paddingLeft: "0.15rem", paddingRight: "0.15rem" }}>
                  {repeatOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setRepeat(opt.value as Task["repeat"] || null)}
                      style={{
                        padding: "0.4rem 0.7rem",
                        borderRadius: "999px",
                        border: (repeat || "") === opt.value
                          ? "2px solid var(--information-color)"
                          : "1px solid var(--border-color)",
                        backgroundColor: (repeat || "") === opt.value
                          ? "var(--information-bg)"
                          : "var(--background)",
                        color: "var(--text-primary)",
                        fontSize: "0.8rem",
                        fontWeight: (repeat || "") === opt.value ? "700" : "normal",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        transform: (repeat || "") === opt.value ? "scale(1.05)" : "scale(1)",
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                      }}
                    >
                      {opt.emoji} {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subtareas */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: "600" }}>
          📝 Subtareas {subtaskTitles.length > 0 && (
            <span style={{ fontWeight: "normal" }}>({subtaskTitles.length})</span>
          )}
        </label>

        {subtaskTitles.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
            {subtaskTitles.map((title, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.35rem 0.5rem",
                  borderRadius: "6px",
                  backgroundColor: "var(--background)",
                  border: "1px solid var(--border-color)",
                }}
              >
                <span style={{ flex: 1, fontSize: "0.85rem", color: "var(--text-primary)" }}>
                  {title}
                </span>
                <button
                  type="button"
                  onClick={() => setSubtaskTitles(subtaskTitles.filter((_, idx) => idx !== i))}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--text-secondary)",
                    cursor: "pointer",
                    fontSize: "1rem",
                    padding: "0 0.25rem",
                    lineHeight: 1,
                  }}
                  aria-label={`Eliminar subtarea "${title}"`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: "0.4rem" }}>
          <UITextInput
            placeholder="Agregar subtarea..."
            value={newSubtask}
            onChange={(e) => setNewSubtask(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                const trimmed = newSubtask.trim();
                if (trimmed) {
                  setSubtaskTitles([...subtaskTitles, trimmed]);
                  setNewSubtask("");
                }
              }
            }}
            style={{ flex: 1, fontSize: "0.85rem" }}
          />
          <button
            type="button"
            onClick={() => {
              const trimmed = newSubtask.trim();
              if (trimmed) {
                setSubtaskTitles([...subtaskTitles, trimmed]);
                setNewSubtask("");
              }
            }}
            disabled={!newSubtask.trim()}
            style={{
              padding: "0.4rem 0.6rem",
              borderRadius: "6px",
              border: "1px solid var(--border-color)",
              backgroundColor: newSubtask.trim() ? "var(--success-bg)" : "var(--surface)",
              color: newSubtask.trim() ? "var(--success-color)" : "var(--text-secondary)",
              cursor: newSubtask.trim() ? "pointer" : "default",
              fontSize: "0.85rem",
              fontWeight: "600",
              flexShrink: 0,
            }}
          >
            +
          </button>
        </div>
      </div>

      <div
        style={{
          alignItems: "center",
          display: "flex",
          justifyContent: "flex-end",
          gap: ".5rem",
          marginBottom: ".5rem",
        }}
      >
        <label htmlFor="isCreatingMore" style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
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
              return;
            }
            if (!cleanListId) {
              showPopUp("DANGER", "Selecciona una lista.");
              return;
            }

            try {
              tags.forEach((name) => {
                addTagToList(finalListId, { id: nanoid(), name });
              });

              onConfirm({
                title: cleanTitle,
                notes: notes.trim() || undefined,
                listId: finalListId,
                tags,
                priority: priority || undefined,
                dueDate: dueDate ? dueDate + "T12:00:00" : undefined,
                repeat: repeat || undefined,
                subtasks: subtaskTitles.length > 0
                  ? subtaskTitles.map((t) => ({
                      id: nanoid(),
                      title: t,
                      isDone: false,
                      createdAt: new Date().toISOString(),
                    }))
                  : undefined,
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
