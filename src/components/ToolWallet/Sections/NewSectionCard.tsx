import React from "react";
import UIButton from "@/components/UI/UIButton";
import UITextInput from "@/components/UI/UITextInput";
import styles from "./Sections.module.css";

interface Props {
  name: string;
  onChange: (val: string) => void;
  onCreate: () => void;
}

const NewSectionCard: React.FC<Props> = ({ name, onChange, onCreate }) => (
  <div className={styles.newSectionCard}>
    <h3 className={styles.newSectionTitle}>⭐ Nuevo apartado</h3>
    <div className={styles.newSectionForm}>
      <div className={styles.newSectionInputWrap}>
        <UITextInput
          value={name}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Nombre del apartado"
          aria-label="Nombre del nuevo apartado"
        />
      </div>
      <UIButton onClick={onCreate} variant="secondary">
        Crear
      </UIButton>
    </div>
  </div>
);

export default NewSectionCard;
