import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useModal } from "@/context/ModalContext";
import { useWalletStore } from "@/stores/walletStore";
import { getCreateSectionModal }  from "@/components/Modal/Presets/Wallet/CreateSectionModal";
import { getDeleteSectionModal }  from "@/components/Modal/Presets/Wallet/DeleteSectionModal";
import { getEditSectionModal } from "@/components/Modal/Presets/Wallet/EditSectionModal";
import NewSectionCard from "@/components/ToolWallet/Sections/NewSectionCard";
import SectionItem from "@/components/ToolWallet/Sections/SectionItem";
import UIButton from "@/components/UI/UIButton";
import UISelect from "@/components/UI/UISelect";

import WalletLayout from "../../layouts/WalletLayout";
import sectionStyles from "@/components/ToolWallet/Sections/Sections.module.css";

const Sections: React.FC = () => {
  const navigate = useNavigate();
  const { sections, expenses, addSection, deleteSection, updateSection, deleteSectionWithMigration } = useWalletStore();
  const { showModal, hideModal } = useModal();
  const [name, setName] = useState("");

  const handleAdd = () => {
    if (!name.trim()) {
      showModal(
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <h3>👀 Campo vacío</h3>
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

  const handleDeleteWithMigration = (sectionId: string, sectionName: string) => {
    // Contar gastos asociados a esta sección
    const associatedExpenses = expenses.filter(
      (e) => e.category === sectionId || e.source === sectionId
    );
    const otherSections = sections.filter((s) => s.id !== sectionId);

    if (associatedExpenses.length > 0 && otherSections.length > 0) {
      // Mostrar modal con opción de migrar
      showModal(
        <MigrateOrDeleteModal
          sectionName={sectionName}
          expenseCount={associatedExpenses.length}
          otherSections={otherSections}
          onMigrate={(targetId) => {
            // Usar la acción atómica del store
            deleteSectionWithMigration(sectionId, targetId);
            hideModal();
          }}
          onDeleteAnyway={() => {
            hideModal();
            // Mostrar confirmación estándar
            showModal(
              getDeleteSectionModal({
                sectionName,
                onCancel: hideModal,
                onConfirm: () => {
                  deleteSection(sectionId);
                  hideModal();
                },
              })
            );
          }}
          onCancel={hideModal}
        />
      );
    } else {
      // Sin gastos asociados, eliminar directamente con confirmación
      showModal(
        getDeleteSectionModal({
          sectionName,
          onCancel: hideModal,
          onConfirm: () => {
            deleteSection(sectionId);
            hideModal();
          },
        })
      );
    }
  };

  return (
    <WalletLayout>
      <div className={sectionStyles.container}>
        <NewSectionCard name={name} onChange={setName} onCreate={handleAdd} />
        <div className={sectionStyles.sectionList}>
          {sections.map((section) => (
            <SectionItem
              key={section.id}
              section={section}
              onEdit={() => {
                showModal(
                  getEditSectionModal({
                    name: section.name,
                    initialValues: {
                      goal: section.goal || null,
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
              onDelete={() => handleDeleteWithMigration(section.id, section.name)}
            />
          ))}
        </div>
      </div>
    </WalletLayout>
  );
};

// Modal interno para migrar gastos o eliminar de todas formas
interface MigrateOrDeleteModalProps {
  sectionName: string;
  expenseCount: number;
  otherSections: { id: string; name: string; icon?: string }[];
  onMigrate: (targetId: string) => void;
  onDeleteAnyway: () => void;
  onCancel: () => void;
}

const MigrateOrDeleteModal: React.FC<MigrateOrDeleteModalProps> = ({
  sectionName,
  expenseCount,
  otherSections,
  onMigrate,
  onDeleteAnyway,
  onCancel,
}) => {
  const [targetId, setTargetId] = useState(otherSections[0]?.id || "");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <h3 style={{ color: "var(--text-primary)" }}>
        ⚠️ "{sectionName}" tiene {expenseCount} movimiento{expenseCount > 1 ? "s" : ""}
      </h3>
      <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
        ¿Qué quieres hacer con los movimientos asociados?
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
          Mover a otro apartado:
        </label>
        <UISelect
          value={targetId}
          onChange={(e) => setTargetId(e.target.value)}
        >
          {otherSections.map((s) => (
            <option key={s.id} value={s.id}>
              {s.icon || "📁"} {s.name}
            </option>
          ))}
        </UISelect>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <UIButton variant="primary" onClick={() => onMigrate(targetId)}>
          Mover y eliminar apartado
        </UIButton>
        <UIButton variant="danger" onClick={onDeleteAnyway}>
          Eliminar sin mover
        </UIButton>
        <UIButton variant="default" onClick={onCancel}>
          Cancelar
        </UIButton>
      </div>
    </div>
  );
};

export default Sections;
