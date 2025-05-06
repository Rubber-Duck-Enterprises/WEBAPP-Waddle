import React from "react";
import localforage from "localforage";
import UIButton from "../components/UI/UIButton";
import DefaultLayout from "../layouts/DefaultLayout";
import { useModal } from "../context/ModalContext";
import { getImportSuccessModal } from "../components/Modal/Presets/ImportSuccessModal";
import { getDeleteAllDataModal } from "../components/Modal/Presets/DeleteAllDataModal";

const BackupPage: React.FC = () => {
  const { showModal, hideModal } = useModal();

  const handleExport = async () => {
    const sectionData = await localforage.getItem("waddle-sections");
    const expenseData = await localforage.getItem("waddle-expenses");

    const exportData = {
      sections: sectionData,
      expenses: expenseData,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "waddle-backup.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    try {
      const data = JSON.parse(text);
      if (data.sections && data.expenses) {
        await localforage.setItem("waddle-sections", data.sections);
        await localforage.setItem("waddle-expenses", data.expenses);

        showModal(
          getImportSuccessModal({
            onConfirm: () => {
              hideModal();
              window.location.reload();
            },
          })
        );
      } else {
        alert("Archivo inválido.");
      }
    } catch (e) {
      alert("Error al importar.");
    }
  };

  return (
    <DefaultLayout>
      <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <h2>☁️ Respaldos</h2>

        <UIButton onClick={handleExport} variant="secondary">
          Exportar respaldo
        </UIButton>

        <UIButton
          variant="danger"
          onClick={() =>
            showModal(
              getDeleteAllDataModal({
                onCancel: hideModal,
                onConfirm: async () => {
                  await localforage.removeItem("waddle-sections");
                  await localforage.removeItem("waddle-expenses");
                  hideModal();
                  window.location.reload();
                },
              })
            )
          }
          >
          Borrar todos los datos
        </UIButton>


        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <label htmlFor="import-backup" style={{ fontWeight: "bold" }}>
            Importar respaldo:
          </label>
          <input
            id="import-backup"
            type="file"
            accept="application/json"
            onChange={handleImport}
            style={{
              padding: "0.5rem",
              border: "1px solid var(--input-border-color)",
              borderRadius: "8px",
              backgroundColor: "var(--input-bg)",
              color: "var(--text-primary)",
            }}
          />
        </div>
      </div>
    </DefaultLayout>
  );
};

export default BackupPage;
