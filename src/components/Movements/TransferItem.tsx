import React from "react";

interface Props {
  amount: number;
  fromLabel: string;
  toLabel: string;
  date: string;
  notes?: string;
}

const TransferItem: React.FC<Props> = ({ amount, fromLabel, toLabel, date, notes }) => {
  return (
    <li
      style={{
        marginBottom: "1rem",
        padding: "1rem",
        border: "1px solid var(--information-color)",
        borderRadius: "8px",
        backgroundColor: "var(--information-bg)",
        boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
        color: "var(--text-primary)",
      }}
    >
      <strong style={{ fontSize: "1rem" }}>↔ Transferencia</strong>

      <div style={{ fontSize: "0.9rem" }}>
        <div>
          <strong>De:</strong> {fromLabel}
        </div>
        <div>
          <strong>A:</strong> {toLabel}
        </div>
      </div>

      <div style={{ fontSize: "0.9rem", color: "var(--success-color)" }}>
        Monto: ${amount.toLocaleString()}
      </div>

      <small style={{ color: "var(--text-secondary)" }}>
        {new Date(date).toLocaleDateString()}
        {notes ? ` · ${notes}` : ""}
      </small>
    </li>
  );
};

export default TransferItem;
