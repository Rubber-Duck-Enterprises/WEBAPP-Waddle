import React from "react";
import { Expense, Section } from "../../types";

interface Props {
  latest: Expense[];
  sections: Section[];
}

const TransactionList: React.FC<Props> = ({ latest, sections }) => (
  <div>
    <h4 style={{ marginBottom: "0.5rem" }}>Últimos movimientos</h4>
    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
      {latest.map((tx) => {
        const section = sections.find((s) => s.id === tx.category);
        return (
          <li
            key={tx.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "0.5rem 0",
              borderBottom: "1px solid var(--border-color)",
              flexDirection: "column",
              color: "var(--text-primary)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>{tx.description}</span>
              <span style={{ color: tx.amount < 0 ? "var(--danger-color)" : "var(--success-color)" }}>
                {tx.amount < 0 ? "-" : "+"}${Math.abs(tx.amount).toLocaleString()}
              </span>
            </div>
            {section && (
              <small style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>
                {section.icon || "📁"} {section.name}
              </small>
            )}
          </li>
        );
      })}
    </ul>
  </div>
);

export default TransactionList;
