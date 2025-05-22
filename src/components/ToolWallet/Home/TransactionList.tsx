import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiChevronDown } from "react-icons/fi";
import { Expense, Section } from "@/types";

interface Props {
  latest: Expense[];
  sections: Section[];
}

const TransactionList: React.FC<Props> = ({ latest, sections }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div
        style={{
          alignItems: "center",
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <h4 style={{ marginBottom: "0.5rem" }}>Últimos movimientos</h4>
        <FiChevronDown
          size={24}
          style={{
            transition: "transform 0.2s ease",
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </div>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {latest.map((tx) => {
                const section = sections.find((s) => s.id === tx.category);
                const source = tx.source ? sections.find((s) => s.id === tx.source) : null;

                return (
                  <motion.div
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
                      <span
                        style={{
                          color: tx.amount < 0 ? "var(--danger-color)" : "var(--success-color)",
                        }}
                      >
                        {tx.amount < 0 ? "-" : "+"}${Math.abs(tx.amount).toLocaleString()}
                      </span>
                    </div>

                    {section && (
                      <small style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>
                        {section.icon || "📁"} {section.name}
                      </small>
                    )}

                    {source && source.id !== tx.category && (
                      <small style={{ color: "var(--text-secondary)", fontSize: "0.75rem" }}>
                        💳 Pagado desde {source.icon || "🏦"} {source.name}
                      </small>
                    )}
                  </motion.div>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default TransactionList;
