// components/UI/FloatingActionButton.tsx
import React from "react";
import { motion } from "framer-motion";
import { FiPlus } from "react-icons/fi";

import { useModal } from "@/context/ModalContext";
import { getCreateTaskModal } from "@/components/Modal/Presets/List/CreateTaskModal";

import { useTaskStore } from "@/stores/TaskStore";

type Props = {
  activeListId: string | "all";
};

const FloatingActionButton: React.FC<Props> = ({ activeListId }) => {
  const { showModal, hideModal } = useModal();

  const { addTask } = useTaskStore();

  return (
    <>
      <motion.button
        onClick={() => {
        showModal(
          getCreateTaskModal({
            activeListId,
            onCancel: hideModal,
            onConfirm: ({ title, dueDate, notes, listId, priority, repeat, tags }) => {
              if (title) {
                addTask({
                  title,
                  dueDate,
                  notes,
                  listId,
                  priority,
                  repeat,
                  tags,
                });
              }
            },
          })
        );}}
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

export default FloatingActionButton;
