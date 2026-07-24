import React from "react";
import UIButton from "@/components/UI/UIButton";
import styles from "./Movements.module.css";

interface Props {
  amount: number;
  fromLabel: string;
  toLabel: string;
  date: string;
  notes?: string;
  onDelete?: () => void;
}

const TransferItem: React.FC<Props> = React.memo(({ amount, fromLabel, toLabel, date, notes, onDelete }) => {
  return (
    <li className={styles.transferItem}>
      <strong className={styles.transferTitle}>↔ Transferencia</strong>

      <div className={styles.transferDetails}>
        <div>
          <strong>De:</strong> {fromLabel}
        </div>
        <div>
          <strong>A:</strong> {toLabel}
        </div>
      </div>

      <div className={styles.transferAmount}>
        Monto: ${amount.toLocaleString()}
      </div>

      <small className={styles.transferMeta}>
        {new Date(date).toLocaleDateString()}
        {notes ? ` · ${notes}` : ""}
      </small>

      {onDelete && (
        <div className={styles.movementActions}>
          <UIButton variant="danger" onClick={onDelete}>
            Eliminar
          </UIButton>
        </div>
      )}
    </li>
  );
});

TransferItem.displayName = "TransferItem";

export default TransferItem;
