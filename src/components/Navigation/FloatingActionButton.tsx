// components/UI/FloatingActionButton.tsx
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiPlus } from "react-icons/fi";

import { useModal } from "@/context/ModalContext";
import { getCreateTaskListModal } from "@/components/Modal/Presets/List/CreateTaskListModal";
import { getCreateTaskModal } from "@/components/Modal/Presets/List/CreateTaskModal";

import { useTaskListStore } from "@/stores/TaskListStore";
import { useTaskStore } from "@/stores/TaskStore";

type Props = {
  activeListId: string | "all";
};

const FloatingActionButton: React.FC<Props> = ({ activeListId }) => {
  const [open, setOpen] = useState(false);
  const { showModal, hideModal } = useModal();

  const { addTaskList } = useTaskListStore();
  const { addTask } = useTaskStore();

  const actions = [
    { 
      label: "Agregar lista", emoji: "📝", 
      onClick: () => {
        showModal(
          getCreateTaskListModal({
            onCancel: hideModal,
            onConfirm: ({ name, color, icon }) => {
              addTaskList({ name, color, icon });
              hideModal();
            }
          })
        );
      } 
    },
    { 
      label: "Agregar tarea", emoji: "➕", 
      onClick: () => {
        showModal(
          getCreateTaskModal({
            activeListId,
            onCancel: hideModal,
            onConfirm: ({ title, dueDate, notes, listId, priority, repeat, tags }) => {
              addTask({
                title,
                dueDate,
                notes,
                listId,
                priority,
                repeat,
                tags,
              });
              
              hideModal();
            },
          })
        );
      }
    },
  ];

  return (
    <>
      {/* Botones secundarios animados */}
      <AnimatePresence>
        {open && (
          <div
            style={{
              position: "fixed",
              bottom: "5.5rem",
              right: "1.5rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
              zIndex: 998,
            }}
          >
            {actions.map((action, index) => (
              <motion.button
                key={action.label}
                onClick={action.onClick}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ delay: index * 0.05 }}
                style={actionStyle}
              >
                <span style={{ fontSize: "1.25rem", marginRight: "0.5rem" }}>{action.emoji}</span>
                {action.label}
              </motion.button>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Botón flotante principal */}
      <motion.button
        onClick={() => setOpen((prev) => !prev)}
        animate={{ rotate: open ? 135 : 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        style={fabStyle}
      >
        <FiPlus size={32} />
      </motion.button>
    </>
  );
};

const fabStyle: React.CSSProperties = {
  position: "fixed",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  bottom: "1.5rem",
  right: "1.5rem",
  width: "56px",
  height: "56px",
  borderRadius: "50%",
  backgroundColor: "var(--information-color)",
  color: "#fff",
  fontSize: "2rem",
  border: "none",
  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
  cursor: "pointer",
  zIndex: 999,
};

const actionStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  padding: "0.5rem 1rem",
  borderRadius: "999px",
  backgroundColor: "var(--surface)",
  color: "var(--text-primary)",
  border: "1px solid var(--border-color)",
  fontSize: "0.9rem",
  cursor: "pointer",
  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  whiteSpace: "nowrap",
};

export default FloatingActionButton;
