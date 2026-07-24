import React from "react";
import UIButton from "@/components/UI/UIButton";
import type { ShoppingTrip } from "@/types/shopping";

interface TripCardProps {
  trip: ShoppingTrip;
  onAction: () => void;
  onEdit?: () => void;
  onViewDetails?: () => void;
  onCancel?: () => void;
}

const TripCard: React.FC<TripCardProps> = ({ trip, onAction, onEdit, onViewDetails, onCancel }) => {
  // Balance = presupuesto de la lista - lo gastado en esa lista
  const balance = trip.status === "completed"
    ? trip.budget - trip.actualTotal
    : trip.budget > 0
      ? trip.budget - trip.estimatedTotal
      : 0;
  const isPositive = balance >= 0;

  const statusConfig: Record<string, { text: string; color: string; borderColor: string }> = {
    planning: { text: "Pendiente", color: "var(--text-secondary)", borderColor: "var(--border-color)" },
    in_progress: { text: "En proceso", color: "#ff9800", borderColor: "#ff9800" },
    completed: {
      text: isPositive ? "En el presupuesto" : "Excedente",
      color: isPositive ? "#4caf50" : "#f44336",
      borderColor: isPositive ? "#4caf50" : "#f44336",
    },
    cancelled: { text: "Cancelada", color: "#9e9e9e", borderColor: "#9e9e9e" },
  };

  const config = statusConfig[trip.status];

  const formatDate = (iso: string) => {
    const date = new Date(iso);
    return date.toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const handleCardClick = () => {
    if (trip.status === "completed") {
      onViewDetails?.();
    } else if (trip.status !== "cancelled") {
      onAction();
    }
  };

  return (
    <div
      style={{
        background: "var(--card-bg)",
        borderRadius: "12px",
        padding: "1rem",
        border: `2px solid ${config.borderColor}`,
        cursor: trip.status === "cancelled" ? "default" : "pointer",
        opacity: trip.status === "cancelled" ? 0.6 : 1,
      }}
      onClick={handleCardClick}
    >
      {/* Fila superior: tienda + balance */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "1rem" }}>⚙️</span>
            <span style={{ fontWeight: "bold", fontSize: "1.05rem", color: "var(--text-primary)" }}>
              {trip.store}
            </span>
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.15rem" }}>
            {trip.status === "planning"
              ? "● Pendiente"
              : formatDate(trip.completedAt || trip.createdAt)}
          </div>
        </div>

        <div style={{ textAlign: "right" }}>
          <div
            style={{
              fontWeight: "bold",
              fontSize: "1.4rem",
              color: trip.status === "completed"
                ? (isPositive ? "#4caf50" : "#f44336")
                : trip.budget > 0
                  ? (isPositive ? "#4caf50" : "#f44336")
                  : "var(--text-primary)",
            }}
          >
            {trip.status === "completed"
              ? `${isPositive ? "+" : "-"}$${Math.abs(balance).toLocaleString()}`
              : trip.budget > 0
                ? `${isPositive ? "+" : "-"}$${Math.abs(balance).toLocaleString()}`
                : `$${trip.estimatedTotal.toLocaleString()}`}
          </div>
          <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>
            {trip.budget > 0 ? "Presupuesto" : "Estimado"}
          </div>
        </div>
      </div>

      {/* Detalle de estimado/gastado/presupuesto */}
      <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.4rem", display: "flex", flexDirection: "column", gap: "0.1rem" }}>
        <span>Estimado: ${trip.estimatedTotal.toLocaleString()}</span>
        {trip.status === "completed" && (
          <span>Gastado: ${trip.actualTotal.toLocaleString()}</span>
        )}
        {trip.budget > 0 && (
          <span>Presupuesto: ${trip.budget.toLocaleString()}</span>
        )}
      </div>

      {/* Pie: estado + acción */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.5rem" }}>
        <span style={{ fontSize: "0.75rem", color: config.color, fontWeight: "bold" }}>
          {config.text}
        </span>
        {trip.status === "completed" && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Ver detalles →</span>
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                style={{
                  background: "none",
                  border: "1px solid var(--border-color)",
                  borderRadius: "6px",
                  padding: "0.2rem 0.5rem",
                  fontSize: "0.75rem",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.2rem",
                }}
              >
                ✏️
              </button>
            )}
          </div>
        )}
        {trip.status === "cancelled" && (
          <span style={{ fontSize: "0.75rem", color: "#9e9e9e" }}>● Cancelada</span>
        )}
        {(trip.status === "planning" || trip.status === "in_progress") && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            {onCancel && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCancel();
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "#f44336",
                  fontSize: "0.75rem",
                  cursor: "pointer",
                  padding: "0.3rem 0",
                }}
              >
                Cancelar
              </button>
            )}
            <UIButton
              variant="primary"
              style={{ fontSize: "0.75rem", padding: "0.3rem 0.7rem" }}
              onClick={(e) => {
                e.stopPropagation();
                onAction();
              }}
            >
              {trip.status === "planning" ? "Comprar" : "Continuar"}
            </UIButton>
          </div>
        )}
      </div>
    </div>
  );
};

export default TripCard;
