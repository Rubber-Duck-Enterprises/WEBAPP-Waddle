import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useShoppingStore } from "@/stores/shoppingStore";
import { useModal } from "@/context/ModalContext";
import { usePopUp } from "@/context/PopUpContext";
import ShoppingLayout from "@/layouts/ShoppingLayout";
import UIButton from "@/components/UI/UIButton";
import UISelect from "@/components/UI/UISelect";
import TripCard from "@/components/Shopping/TripCard";

const ITEMS_PER_PAGE = 8;

type FilterStatus = "all" | "completed" | "in_progress" | "planning" | "cancelled";

const ShoppingHistory: React.FC = () => {
  const navigate = useNavigate();
  const { showModal, hideModal } = useModal();
  const { showPopUp } = usePopUp();
  const { trips, cancelTrip } = useShoppingStore();
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [storeFilter, setStoreFilter] = useState("");

  // Tiendas únicas para el filtro
  const uniqueStores = useMemo(() => {
    const stores = new Set(trips.map((t) => t.store));
    return Array.from(stores);
  }, [trips]);

  // Filtrar y ordenar
  const filteredTrips = useMemo(() => {
    let result = [...trips];

    if (statusFilter !== "all") {
      result = result.filter((t) => t.status === statusFilter);
    }
    if (storeFilter) {
      result = result.filter((t) => t.store === storeFilter);
    }

    // Ordenar por fecha (más reciente primero)
    result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return result;
  }, [trips, statusFilter, storeFilter]);

  const paginatedTrips = filteredTrips.slice(0, (page + 1) * ITEMS_PER_PAGE);
  const hasMore = paginatedTrips.length < filteredTrips.length;

  const handleCancelTrip = (tripId: string, storeName: string) => {
    showModal(
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", textAlign: "center" }}>
        <div style={{ fontSize: "2rem" }}>🚫</div>
        <h3 style={{ color: "var(--text-primary)" }}>Cancelar compra</h3>
        <p style={{ color: "var(--text-secondary)" }}>
          ¿Estás seguro de que quieres cancelar la compra en {storeName}?
        </p>
        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
          <UIButton variant="default" onClick={hideModal}>Volver</UIButton>
          <UIButton
            variant="danger"
            onClick={() => {
              cancelTrip(tripId);
              hideModal();
              showPopUp("INFO", "Compra cancelada.");
            }}
          >
            Cancelar compra
          </UIButton>
        </div>
      </div>
    );
  };

  return (
    <ShoppingLayout>
      <div style={{ padding: "1rem" }}>
        <h2 style={{ fontSize: "1.2rem", fontWeight: "bold", color: "var(--text-primary)", marginBottom: "1rem" }}>
          🛒 Registro de compras
        </h2>

        {/* Filtros */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", overflowX: "auto", flexWrap: "nowrap", WebkitOverflowScrolling: "touch" }}>
          <UISelect
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as FilterStatus); setPage(0); }}
            style={{ flex: 1, minWidth: "140px" }}
          >
            <option value="all">Todos los estados</option>
            <option value="completed">Compradas</option>
            <option value="in_progress">En proceso</option>
            <option value="planning">Pendientes</option>
            <option value="cancelled">Canceladas</option>
          </UISelect>

          <UISelect
            value={storeFilter}
            onChange={(e) => { setStoreFilter(e.target.value); setPage(0); }}
            style={{ flex: 1, minWidth: "140px" }}
          >
            <option value="">Todas las tiendas</option>
            {uniqueStores.map((store) => (
              <option key={store} value={store}>{store}</option>
            ))}
          </UISelect>
        </div>

        {/* Lista de compras */}
        {filteredTrips.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem 1rem", color: "var(--text-secondary)" }}>
            <p style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📋</p>
            <p>No hay compras que mostrar.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {paginatedTrips.map((trip) => (
              <TripCard
                key={trip.id}
                trip={trip}
                onAction={() => navigate(`/shopping/trip/${trip.id}`)}
                onEdit={() => navigate(`/shopping/edit/${trip.id}`)}
                onViewDetails={() => navigate(`/shopping/trip/${trip.id}`)}
                onCancel={() => handleCancelTrip(trip.id, trip.store)}
              />
            ))}

            {hasMore && (
              <UIButton variant="default" fullWidth onClick={() => setPage((p) => p + 1)}>
                Ver más
              </UIButton>
            )}
          </div>
        )}
      </div>
    </ShoppingLayout>
  );
};

export default ShoppingHistory;
