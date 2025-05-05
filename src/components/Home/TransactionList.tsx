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
              borderBottom: "1px solid #eee",
              flexDirection: "column",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>{tx.description}</span>
              <span style={{ color: tx.amount < 0 ? "#f44336" : "#4caf50" }}>
                {tx.amount < 0 ? "-" : "+"}${Math.abs(tx.amount).toLocaleString()}
              </span>
            </div>
            {section && (
              <small style={{ color: "#777", fontSize: "0.8rem" }}>
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
