import React from "react";
import localforage from "localforage";
import UIButton from "../components/UI/UIButton";
import DefaultLayout from "../layouts/DefaultLayout";

const BackupPage: React.FC = () => {
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
        alert("Importación exitosa. Recarga la página para ver los cambios.");
      } else {
        alert("Archivo inválido.");
      }
    } catch (e) {
      alert("Error al importar.");
    }
  };

  return (
    <DefaultLayout>
      <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
        <h2>☁️ Respaldos</h2>

        <UIButton onClick={handleExport} variant="secondary">
          Exportar respaldo
        </UIButton>

        <label style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <strong>Importar respaldo:</strong>
          <input type="file" accept="application/json" onChange={handleImport} />
        </label>
      </div>
    </DefaultLayout>
  );
};

export default BackupPage;
