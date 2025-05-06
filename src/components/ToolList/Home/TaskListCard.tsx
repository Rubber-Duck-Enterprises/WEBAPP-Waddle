// components/ToolList/Home/NewTaskListCard.tsx
import React from "react";
import UIButton from "../../UI/UIButton";
import UITextInput from "../../UI/UITextInput";

interface Props {
  name: string;
  onChange: (val: string) => void;
  onCreate: () => void;
}

const NewTaskListCard: React.FC<Props> = ({ name, onChange, onCreate }) => (
  <div
    style={{
      background: "var(--surface)",
      padding: "1rem",
      borderRadius: "12px",
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    }}
  >
    <h3 style={{ marginBottom: "0.5rem", color: "var(--text-primary)" }}>Nueva lista</h3>
    <div style={{ display: "flex", gap: "0.5rem" }}>
      <div style={{ flex: 1 }}>
        <UITextInput
          value={name}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Nombre de la lista"
        />
      </div>
      <UIButton onClick={onCreate} variant="secondary">
        Crear
      </UIButton>
    </div>
  </div>
);

export default NewTaskListCard;
