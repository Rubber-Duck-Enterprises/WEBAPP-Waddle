import React from "react";
import { Expense, Section } from "@/types";

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
        const source = tx.source ? sections.find((s) => s.id === tx.source) : null;

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

            {/* Sección de destino */}
            {section && (
              <small style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>
                {section.icon || "📁"} {section.name}
              </small>
            )}

            {/* Fuente de pago distinta (si existe y no es la misma que category) */}
            {source && source.id !== tx.category && (
              <small style={{ color: "var(--text-secondary)", fontSize: "0.75rem" }}>
                💳 Pagado desde {source.icon || "🏦"} {source.name}
              </small>
            )}
          </li>
        );
      })}
    </ul>
  </div>
);

export default TransactionList;
