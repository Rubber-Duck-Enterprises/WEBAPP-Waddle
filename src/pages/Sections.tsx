import React, { useState } from "react";

import { useModal } from "../context/ModalContext";
import { getDeleteSectionModal } from "../components/Modal/Presets/DeleteSectionModal";
import { getCreateSectionModal } from "../components/Modal/Presets/CreateSectionModal";
import { getEditSectionModal } from "../components/Modal/Presets/EditSectionModal";
import { useSectionStore } from "../stores/sectionStore";

import UIButton from "../components/UI/UIButton";
import DefaultLayout from "../layouts/DefaultLayout";

const Sections: React.FC = () => {
  const { sections, addSection, deleteSection, updateSection } = useSectionStore();
  const [name, setName] = useState("");
  const { showModal, hideModal } = useModal();

  const handleAdd = () => {
    if (!name.trim()) {
      showModal(
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <h3>Campo vacío</h3>
          <p>Por favor escribe un nombre antes de crear el apartado.</p>
          <UIButton onClick={hideModal}>Entendido</UIButton>
        </div>
      );
      return;
    }

    showModal(
      getCreateSectionModal({
        name: name.trim(),
        onCancel: hideModal,
        onConfirm: ({ goal, color, icon }) => {
          addSection({
            name: name.trim(),
            goal,
            color,
            icon,
          });
          setName("");
          hideModal();
        },
      })
    );
  };
  
  const handleEdit = (sectionId: string) => {
    const section = sections.find((s) => s.id === sectionId);
    if (!section) return;
  
    showModal(
      getEditSectionModal({
        name: section.name,
        initialValues: {
          goal: section.goal || 0,
          color: section.color || "",
          icon: section.icon || "",
        },
        onCancel: hideModal,
        onConfirm: ({ goal, color, icon }) => {
          updateSection(sectionId, { goal, color, icon });
          hideModal();
        },
      })
    );
  };

  const openDeleteConfirmation = (sectionId: string, sectionName: string) => {
    showModal(
      getDeleteSectionModal({
        sectionName,
        onConfirm: () => {
          deleteSection(sectionId);
          hideModal();
        },
        onCancel: hideModal,
      })
    );
  };

  return (
    <DefaultLayout>
      <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
        {/* Card de creación */}
        <div
          style={{
            background: "#f9f9f9",
            padding: "1rem",
            borderRadius: "12px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          <h3 style={{ marginBottom: "0.5rem" }}>Nuevo apartado</h3>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre del apartado"
              style={{
                flex: 1,
                padding: "0.5rem",
                border: "1px solid #ccc",
                borderRadius: "8px",
              }}
            />
            <UIButton onClick={handleAdd} variant="secondary">
              Crear
            </UIButton>
          </div>
        </div>

        {/* Lista de apartados existentes */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {sections.map((section) => (
            <div
              key={section.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "1rem",
                borderRadius: "12px",
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                background: "#fff",
                border: "1px solid #eee",
                borderLeft: `16px solid ${section.color || "#ccc"}`,
                gap: "1rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", flex: 1 }}>
                <div style={{ fontSize: "2rem" }}>{section.icon || "📁"}</div>
                <div>
                  <h4 style={{ margin: 0 }}>{section.name}</h4>
                  <small style={{ color: "#777" }}>
                    {section.goal ? `🎯 Meta: $${section.goal.toLocaleString()}` : "Sin meta"}
                  </small>
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.5rem" }}>
                <UIButton
                  variant="secondary"
                  onClick={() => handleEdit(section.id)}
                >
                  Editar
                </UIButton>
                <UIButton
                  variant="danger"
                  onClick={() => openDeleteConfirmation(section.id, section.name)}
                >
                  Eliminar
                </UIButton>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DefaultLayout>
  );
};

export default Sections;
