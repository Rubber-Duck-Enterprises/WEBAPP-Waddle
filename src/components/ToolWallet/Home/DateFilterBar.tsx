import React from "react";
import UIBulletItem from "@/components/UI/UIBulletItem";
import styles from "./DateFilterBar.module.css";

interface Props {
  rangeType: "month" | "week" | "all" | "custom";
  setRangeType: (value: "month" | "week" | "all" | "custom") => void;
  customStart: string;
  customEnd: string;
  setCustomStart: (val: string) => void;
  setCustomEnd: (val: string) => void;
}

const DateFilterBar: React.FC<Props> = ({
  rangeType,
  setRangeType,
  customStart,
  customEnd,
  setCustomStart,
  setCustomEnd,
}) => (
  <div className={styles.container}>
    {(["all", "month", "week", "custom"] as const).map((type) => (
      <UIBulletItem
        key={type}
        onClick={() => setRangeType(type)}
        active={rangeType === type}
        color="#ffcd00"
      >
        {type === "all" && "Todo"}
        {type === "month" && "Mes"}
        {type === "week" && "Semana"}
        {type === "custom" && "Rango"}
      </UIBulletItem>
    ))}

    {rangeType === "custom" && (
      <>
        <input
          type="date"
          value={customStart}
          onChange={(e) => setCustomStart(e.target.value)}
          className={styles.dateInput}
          aria-label="Fecha inicio"
        />
        <input
          type="date"
          value={customEnd}
          onChange={(e) => setCustomEnd(e.target.value)}
          className={styles.dateInput}
          aria-label="Fecha fin"
        />
      </>
    )}
  </div>
);

export default DateFilterBar;
