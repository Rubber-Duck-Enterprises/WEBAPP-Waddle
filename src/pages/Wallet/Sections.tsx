import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useModal } from "../../context/ModalContext";
import { useSectionStore } from "../../stores/sectionStore";
import { getCreateSectionModal }  from "../../components/Modal/Presets/CreateSectionModal";
import { getDeleteSectionModal }  from "../../components/Modal/Presets/DeleteSectionModal";
import { getEditSectionModal } from "../../components/Modal/Presets/EditSectionModal";
import NewSectionCard from "../../components/ToolWallet/Sections/NewSectionCard";
import SectionItem from "../../components/ToolWallet/Sections/SectionItem";
import UIButton from "../../components/UI/UIButton";

import WalletLayout from "../../layouts/WalletLayout";

const Sections: React.FC = () => {
  const navigate = useNavigate();
  const { sections, addSection, deleteSection, updateSection } = useSectionStore();
  const { showModal, hideModal } = useModal();
  const [name, setName] = useState("");

  const handleAdd = () => {
    if (!name.trim()) {
      showModal(
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <h3>Campo vacío</h3>
          <p>Por favor escribe un nombre antes de crear el apartado.</p>
          <UIButton 
            onClick={hideModal} 
            variant="secondary"
          >
            Entendido
          </UIButton>
        </div>
      );
      return;
    }

    showModal(
      getCreateSectionModal({
        name: name.trim(),
        onCancel: hideModal,
        onConfirm: ({ goal, color, icon, type, cardSettings }) => {
          addSection({ name: name.trim(), goal, color, icon, type, cardSettings });
          setName("");
          hideModal();
        },
        goToSettings: () => {
          hideModal();
          navigate("/settings");
        }
      })
    );
  };

  return (
    <WalletLayout>
      <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
        <NewSectionCard name={name} onChange={setName} onCreate={handleAdd} />
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {sections.map((section) => (
            <SectionItem
              key={section.id}
              section={section}
              onEdit={() => {
                showModal(
                  getEditSectionModal({
                    name: section.name,
                    initialValues: {
                      goal: section.goal || 0,
                      color: section.color || "",
                      icon: section.icon || "",
                      type: section.type || "standard",
                    },
                    onCancel: hideModal,
                    onConfirm: ({ goal, color, icon }) => {
                      updateSection(section.id, { goal, color, icon });
                      hideModal();
                    },
                  })
                );
              }}
              onDelete={() =>
                showModal(
                  getDeleteSectionModal({
                    sectionName: section.name,
                    onCancel: hideModal,
                    onConfirm: () => {
                      deleteSection(section.id);
                      hideModal();
                    },
                  })
                )
              }
            />
          ))}
        </div>
      </div>
    </WalletLayout>
  );
};

export default Sections;
