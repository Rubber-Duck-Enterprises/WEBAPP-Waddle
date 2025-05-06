import React from "react";
import UIBulletItem from "../UI/UIBulletItem";

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
  <div
    style={{
      display: "flex",
      gap: "0.5rem",
      flexWrap: "wrap",
      padding: "1rem",
      paddingBottom: "0",
    }}
  >
    {["month", "week", "all", "custom"].map((type) => (
      <UIBulletItem
        key={type}
        onClick={() => setRangeType(type as any)}
        active={rangeType === type}
        color="#ffcd00"
      >
        {type === "month" && "Mes"}
        {type === "week" && "Semana"}
        {type === "all" && "Todo"}
        {type === "custom" && "Rango"}
      </UIBulletItem>
    ))}

    {rangeType === "custom" && (
      <>
        <input
          type="date"
          value={customStart}
          onChange={(e) => setCustomStart(e.target.value)}
          style={{
            padding: "0.4rem",
            borderRadius: "8px",
            border: "1px solid var(--input-border-color)",
            background: "var(--input-bg)",
            color: "var(--text-primary)",
          }}
        />
        <input
          type="date"
          value={customEnd}
          onChange={(e) => setCustomEnd(e.target.value)}
          style={{
            padding: "0.4rem",
            borderRadius: "8px",
            border: "1px solid var(--input-border-color)",
            background: "var(--input-bg)",
            color: "var(--text-primary)",
          }}
        />
      </>
    )}
  </div>
);

export default DateFilterBar;
