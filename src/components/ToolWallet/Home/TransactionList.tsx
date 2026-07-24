import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiChevronDown } from "react-icons/fi";
import { Expense, Section } from "@/types";
import styles from "./TransactionList.module.css";

interface Props {
  latest: Expense[];
  sections: Section[];
  defaultOpen?: boolean;
}

const TransactionList: React.FC<Props> = ({ latest, sections, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <>
      <div
        className={styles.header}
        onClick={() => setIsOpen(!isOpen)}
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
        aria-label="Mostrar últimos movimientos"
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setIsOpen(!isOpen); }}
      >
        <h4>Últimos movimientos</h4>
        <FiChevronDown
          size={24}
          className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ""}`}
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
            <ul className={styles.list}>
              {latest.map((tx) => {
                const section = sections.find((s) => s.id === tx.category);
                const source = tx.source ? sections.find((s) => s.id === tx.source) : null;

                return (
                  <motion.li key={tx.id} className={styles.item}>
                    <div className={styles.itemRow}>
                      <span>{tx.description}</span>
                      <span className={tx.amount < 0 ? styles.amountNegative : styles.amountPositive}>
                        {tx.amount < 0 ? "-" : "+"}${Math.abs(tx.amount).toLocaleString()}
                      </span>
                    </div>

                    {section && (
                      <small className={styles.sectionLabel}>
                        {section.icon || "📁"} {section.name}
                      </small>
                    )}

                    {source && source.id !== tx.category && (
                      <small className={styles.sourceLabel}>
                        💳 Pagado desde {source.icon || "🏦"} {source.name}
                      </small>
                    )}
                  </motion.li>
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
