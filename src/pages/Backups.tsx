// pages/BackupPage.tsx
import React from "react";
import localforage from "localforage";
import UIButton from "@/components/UI/UIButton";
import { FiPlus } from "react-icons/fi";
import DefaultLayout from "@/layouts/DefaultLayout";
import { useModal } from "@/context/ModalContext";
import { getImportSuccessModal } from "@/components/Modal/Presets/System/ImportSuccessModal";
import { getDeleteAllDataModal } from "@/components/Modal/Presets/System/DeleteAllDataModal";

type SectionKey =
  | "waddle-sections"
  | "waddle-expenses"
  | "waddle-task-lists"
  | "waddle-tasks";

const BackupPage: React.FC = () => {
  const { showModal, hideModal } = useModal();

  const exportData = async (keys: SectionKey[], filename: string) => {
    const data: Record<string, any> = {};
    for (const key of keys) {
      data[key] = await localforage.getItem(key);
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = async (
    event: React.ChangeEvent<HTMLInputElement>,
    expectedKeys: SectionKey[]
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Compatibilidad con respaldos antiguos
      const normalizedData: Partial<Record<SectionKey, any>> = {
        "waddle-sections": data["waddle-sections"] ?? data["sections"],
        "waddle-expenses": data["waddle-expenses"] ?? data["expenses"],
        "waddle-task-lists": data["waddle-task-lists"] ?? data["taskLists"],
        "waddle-tasks": data["waddle-tasks"] ?? data["tasks"],
      };

      const keysToImport = expectedKeys.filter((key) => normalizedData[key]);

      if (keysToImport.length > 0) {
        for (const key of keysToImport) {
          await localforage.setItem(key, normalizedData[key]);
        }

        showModal(
          getImportSuccessModal({
            onConfirm: () => {
              hideModal();
              window.location.reload();
            },
          })
        );
      } else {
        alert("El archivo no contiene datos válidos.");
      }
    } catch (e) {
      alert("Error al importar archivo.");
    }
  };

  const renderSection = (
    title: string,
    keys: SectionKey[],
    filename: string,
    showDelete = true
  ) => (
    <div
      style={{
        backgroundColor: "var(--surface)",
        border: "1px solid var(--border-color)",
        borderRadius: "8px",
        padding: "1rem",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
      }}
    >
      <h3>{title}</h3>

      <UIButton onClick={() => exportData(keys, filename)} variant="secondary">
        Exportar {title}
      </UIButton>

      <label
        style={{
          backgroundColor: "var(--surface)",
          border: "2px dashed var(--text-secondary)",
          borderRadius: "8px",
          padding: "0.5rem",
          position: "relative",
          width: "100%",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: "0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-secondary)",
          }}
        >
          <FiPlus size={32} color="var(--text-secondary)"/>
          <span style={{ marginLeft: "0.5rem" }}>Importar {title}</span>
        </div>
        
        <input
          type="file"
          accept="application/json"
          onChange={(e) => importData(e, keys)}
          style={{ opacity: "0" }}  
        />
      </label>

      {showDelete && (
        <UIButton
          variant="danger"
          onClick={() =>
            showModal(
              getDeleteAllDataModal({
                onCancel: hideModal,
                onConfirm: async () => {
                  for (const key of keys) {
                    await localforage.removeItem(key);
                  }
                  hideModal();
                  window.location.reload();
                },
              })
            )
          }
        >
          Borrar {title}
        </UIButton>
      )}
    </div>
  );

  return (
    <DefaultLayout>
      <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "2rem" }}>
        <h2>☁️ Respaldos</h2>

        {renderSection("Wallet", ["waddle-sections", "waddle-expenses"], "waddle-wallet.json")}

        {renderSection("Listas", ["waddle-task-lists", "waddle-tasks"], "waddle-listas.json")}

        {renderSection("Respaldo completo", ["waddle-sections", "waddle-expenses", "waddle-task-lists", "waddle-tasks"], "waddle-backup-completo.json", false)}

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <UIButton
            variant="danger"
            onClick={() =>
              showModal(
                getDeleteAllDataModal({
                  onCancel: hideModal,
                  onConfirm: async () => {
                    await Promise.all([
                      localforage.removeItem("waddle-sections"),
                      localforage.removeItem("waddle-expenses"),
                      localforage.removeItem("waddle-task-lists"),
                      localforage.removeItem("waddle-tasks"),
                    ]);
                    hideModal();
                    window.location.reload();
                  },
                })
              )
            }
          >
            🧨 Borrar TODO
          </UIButton>
        </div>
      </div>
    </DefaultLayout>
  );
};

export default BackupPage;
