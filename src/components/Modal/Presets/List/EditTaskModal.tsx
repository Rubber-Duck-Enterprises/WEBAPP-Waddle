import React, { useState } from "react";
import { nanoid } from "nanoid";
import { motion, AnimatePresence } from "framer-motion";
import { FiChevronDown } from "react-icons/fi";
import { Task } from "@/types";
import { useListStore } from "@/stores/listStore";
import UITextInput from "@/components/UI/UITextInput";
import UITextArea from "@/components/UI/UITextArea";
import UISelect from "@/components/UI/UISelect";
import UIButton from "@/components/UI/UIButton";
import UITagInput from "@/components/UI/UITagInput";
import UISubtaskList from "@/components/UI/UISubtaskList";

type Props = {
  activeListId: string | "all";
  task: Task;
  onConfirm: (updatedTask: Partial<Task>) => void;
  onDelete: () => void;
  onCancel: () => void;
};

export const getEditTaskModal = (props: Props) => <EditTaskModal {...props} />;

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

const EditTaskModal: React.FC<Props> = ({
  activeListId,
  task,
  onConfirm,
  onDelete,
  onCancel,
}) => {
  const { taskLists, getTagsForList, addTagToList, addSubtask, toggleSubtask, deleteSubtask } = useListStore();

  const [title, setTitle] = useState(task.title || "");
  const [notes, setNotes] = useState(task.notes || "");
  const [tags, setTags] = useState<string[]>(task.tags || []);
  const [selectedListId, setSelectedListId] = useState(task.listId || "");
  const [showAdvanced, setShowAdvanced] = useState(
    Boolean(task.priority || task.dueDate || task.repeat)
  );

  // Campos avanzados
  const [priority, setPriority] = useState<Task["priority"]>(task.priority);
  const [dueDate, setDueDate] = useState(
    task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : ""
  );
  const [repeat, setRepeat] = useState<Task["repeat"]>(task.repeat || null);

  const isValid =
    title.trim().length > 0 && (activeListId !== "all" || selectedListId);
  const finalListId = activeListId === "all" ? selectedListId : activeListId;

  const suggestedTags = getTagsForList(finalListId).map((t) => t.name);

  // Resumen visual de opciones avanzadas configuradas
  const advancedSummary = [
    priority && `${priorityOptions.find(o => o.value === priority)?.emoji} ${priorityOptions.find(o => o.value === priority)?.label}`,
    dueDate && `📅 ${new Date(dueDate).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}`,
    repeat && `${repeatOptions.find(o => o.value === repeat)?.emoji} ${repeatOptions.find(o => o.value === repeat)?.label}`,
  ].filter(Boolean);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <h3 style={{ color: "var(--text-primary)" }}>✏️ Editar tarea</h3>

      <UITextInput
        placeholder="Título de la tarea"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <UITextArea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notas"
        rows={3}
      />

      {/* Tags con sistema de chips */}
      <UITagInput
        tags={tags}
        onChange={setTags}
        suggestions={suggestedTags}
        placeholder="Agregar etiqueta..."
      />

      {activeListId === "all" && (
        <UISelect value={selectedListId} onChange={(e) => setSelectedListId(e.target.value)}>
          <option value="" disabled>
            Selecciona una lista
          </option>
          {taskLists.map((l) => (
            <option key={l.id} value={l.id}>
              {l.icon} {l.name}
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
      <UISubtaskList
        subtasks={task.subtasks || []}
        onAdd={(title) => addSubtask(task.id, title)}
        onToggle={(subtaskId) => toggleSubtask(task.id, subtaskId)}
        onDelete={(subtaskId) => deleteSubtask(task.id, subtaskId)}
      />

      <div
        style={{ display: "flex", justifyContent: "space-between", marginTop: "0.5rem" }}
      >
        <UIButton onClick={onDelete} variant="danger">
          Eliminar
        </UIButton>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <UIButton onClick={onCancel} variant="default">
            Cancelar
          </UIButton>
          <UIButton
            variant="primary"
            disabled={!isValid}
            onClick={() => {
              if (isValid) {
                tags.forEach((name) => {
                  addTagToList(finalListId, { id: nanoid(), name });
                });

                onConfirm({
                  title: title.trim(),
                  notes: notes.trim() || undefined,
                  listId: finalListId,
                  tags,
                  priority: priority || undefined,
                  dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
                  repeat: repeat || undefined,
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
