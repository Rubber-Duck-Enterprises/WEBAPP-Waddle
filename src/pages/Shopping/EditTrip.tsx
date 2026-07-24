import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useShoppingStore } from "@/stores/shoppingStore";
import { useModal } from "@/context/ModalContext";
import { usePopUp } from "@/context/PopUpContext";
import ShoppingLayout from "@/layouts/ShoppingLayout";
import UIButton from "@/components/UI/UIButton";
import UITextInput from "@/components/UI/UITextInput";
import UISelect from "@/components/UI/UISelect";
import type { ShoppingItem, ShoppingItemUnit } from "@/types/shopping";

const UNITS: { value: ShoppingItemUnit; label: string }[] = [
  { value: "unidad", label: "Unidad" },
  { value: "kg", label: "Kilogramo" },
  { value: "g", label: "Gramo" },
  { value: "L", label: "Litro" },
  { value: "ml", label: "Mililitro" },
  { value: "paquete", label: "Paquete" },
];

const EditTrip: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const { showModal, hideModal } = useModal();
  const { showPopUp } = usePopUp();
  const { trips, updateTripItem, removeItemFromTrip, categories, completeTrip } = useShoppingStore();

  const trip = trips.find((t) => t.id === tripId);

  if (!trip) {
    return (
      <ShoppingLayout>
        <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-secondary)" }}>
          <p>Compra no encontrada.</p>
          <UIButton variant="primary" onClick={() => navigate("/shopping")}>
            Volver
          </UIButton>
        </div>
      </ShoppingLayout>
    );
  }

  const activeItems = trip.items.filter((i) => !i.removed);
  const purchasedItems = activeItems.filter((i) => i.inCart);
  const pendingItems = activeItems.filter((i) => !i.inCart);

  // Calcular totales actuales
  const currentTotal = purchasedItems.reduce(
    (acc, i) => acc + (i.actualPrice ?? i.estimatedPrice) * i.quantity,
    0
  );

  const handleEditItem = (item: ShoppingItem) => {
    showModal(
      <EditItemModal
        item={item}
        categories={categories}
        onCancel={hideModal}
        onConfirm={(updated) => {
          updateTripItem(trip.id, item.id, updated);
          hideModal();
          // Recalcular actualTotal del trip
          recalculateTrip();
          showPopUp("SUCCESS", `${updated.name || item.name} actualizado.`);
        }}
        onRemove={() => {
          removeItemFromTrip(trip.id, item.id);
          hideModal();
          recalculateTrip();
          showPopUp("INFO", `${item.name} eliminado.`);
        }}
      />
    );
  };

  // Recalcular el actualTotal del trip después de editar
  const recalculateTrip = () => {
    // Forzar recalcular completando de nuevo (ya está completed, pero recalcula totales)
    setTimeout(() => {
      completeTrip(trip.id);
    }, 50);
  };

  return (
    <ShoppingLayout>
      <div style={{ padding: "1rem", paddingBottom: "5rem" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-primary)",
              fontSize: "1.2rem",
              cursor: "pointer",
            }}
          >
            ←
          </button>
          <h2 style={{ fontSize: "1.1rem", fontWeight: "bold", color: "var(--text-primary)", margin: 0 }}>
            ✏️ Editar compra
          </h2>
        </div>

        {/* Info del trip */}
        <div
          style={{
            background: "var(--information-bg)",
            borderRadius: "12px",
            padding: "0.75rem 1rem",
            marginBottom: "1rem",
            border: "1px solid var(--information-color)",
            boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ fontWeight: "bold", color: "var(--text-primary)" }}>⚙️ {trip.store}</div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
              {trip.listName} · {new Date(trip.completedAt || trip.createdAt).toLocaleDateString("es-MX")}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontWeight: "bold", fontSize: "1.1rem", color: "var(--text-primary)" }}>
              ${currentTotal.toLocaleString()}
            </div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>Total gastado</div>
          </div>
        </div>

        {/* Productos comprados */}
        {purchasedItems.length > 0 && (
          <Section title="🛒 En carrito" count={purchasedItems.length}>
            {purchasedItems.map((item) => (
              <EditableItemCard key={item.id} item={item} onEdit={() => handleEditItem(item)} />
            ))}
          </Section>
        )}

        {/* Productos pendientes */}
        {pendingItems.length > 0 && (
          <Section title="🕐 No comprados" count={pendingItems.length}>
            {pendingItems.map((item) => (
              <EditableItemCard key={item.id} item={item} onEdit={() => handleEditItem(item)} variant="pending" />
            ))}
          </Section>
        )}
      </div>

      {/* Botón fijo para volver */}
      <div
        style={{
          position: "fixed",
          bottom: "calc(56px + var(--safe-area-bottom, 0px))",
          left: 0,
          right: 0,
          padding: "0.75rem 1rem",
          background: "var(--background)",
          borderTop: "1px solid var(--border-color)",
          zIndex: 100,
        }}
      >
        <UIButton variant="primary" fullWidth onClick={() => navigate(-1)}>
          Listo
        </UIButton>
      </div>
    </ShoppingLayout>
  );
};

// --- Sección colapsable ---
const Section: React.FC<{ title: string; count: number; children: React.ReactNode }> = ({ title, count, children }) => {
  return (
    <div style={{ marginBottom: "1rem" }}>
      <div style={{
        fontSize: "0.85rem",
        fontWeight: "bold",
        color: "var(--text-secondary)",
        marginBottom: "0.5rem",
      }}>
        {title} ({count})
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {children}
      </div>
    </div>
  );
};

// --- Card de item editable ---
const EditableItemCard: React.FC<{
  item: ShoppingItem;
  onEdit: () => void;
  variant?: "default" | "pending";
}> = ({ item, onEdit, variant = "default" }) => {
  const borderColor = variant === "pending" ? "var(--border-color)" : "#4caf50";
  const bgColor = variant === "pending" ? "var(--surface)" : "#4caf501A";
  const opacity = variant === "pending" ? 0.7 : 1;

  const displayPrice = item.inCart ? (item.actualPrice ?? item.estimatedPrice) : item.estimatedPrice;
  const total = displayPrice * item.quantity;

  return (
    <div
      onClick={onEdit}
      style={{
        background: bgColor,
        borderRadius: "10px",
        padding: "0.7rem 0.75rem",
        border: `1px solid ${borderColor}`,
        opacity,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        cursor: "pointer",
      }}
    >
      <div>
        <div style={{ fontWeight: "500", color: "var(--text-primary)", fontSize: "0.9rem" }}>
          {item.name} <span style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>x{item.quantity}</span>
        </div>
        <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>
          ${displayPrice} c/u · {item.category} · {item.unit}
        </div>
      </div>
      <div style={{ textAlign: "right", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <div>
          <div style={{ fontWeight: "bold", fontSize: "0.95rem", color: "var(--text-primary)" }}>
            ${total.toLocaleString()}
          </div>
          <div style={{ fontSize: "0.65rem", color: "var(--text-secondary)" }}>total</div>
        </div>
        <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>✏️</span>
      </div>
    </div>
  );
};

// --- Modal de edición de producto ---
const EditItemModal: React.FC<{
  item: ShoppingItem;
  categories: { id: string; name: string; icon: string }[];
  onCancel: () => void;
  onConfirm: (updated: Partial<ShoppingItem>) => void;
  onRemove: () => void;
}> = ({ item, categories, onCancel, onConfirm, onRemove }) => {
  const [name, setName] = useState(item.name);
  const [quantity, setQuantity] = useState(String(item.quantity));
  const [unit, setUnit] = useState<ShoppingItemUnit>(item.unit);
  const [category, setCategory] = useState(item.category);
  const [priceMode, setPriceMode] = useState<"unitario" | "total">("unitario");
  const [price, setPrice] = useState(String(item.actualPrice ?? item.estimatedPrice));
  const { showPopUp } = usePopUp();

  const unitPrice = priceMode === "unitario"
    ? (Number(price) || 0)
    : (Number(quantity) || 0) > 0 ? (Number(price) || 0) / (Number(quantity) || 1) : 0;

  const totalPrice = priceMode === "unitario"
    ? (Number(price) || 0) * (Number(quantity) || 0)
    : (Number(price) || 0);

  const handleConfirm = () => {
    if (!name.trim()) {
      showPopUp("DANGER", "Escribe el nombre del producto.");
      return;
    }
    if (Number(quantity) <= 0) {
      showPopUp("DANGER", "La cantidad debe ser mayor a 0.");
      return;
    }
    if (unitPrice < 0) {
      showPopUp("DANGER", "El precio no puede ser negativo.");
      return;
    }

    const updated: Partial<ShoppingItem> = {
      name: name.trim(),
      quantity: Number(quantity),
      unit,
      category,
    };

    // Actualizar precio según si está en carrito o no
    if (item.inCart) {
      updated.actualPrice = unitPrice;
    } else {
      updated.estimatedPrice = unitPrice;
    }

    onConfirm(updated);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <h3 style={{ color: "var(--text-primary)" }}>✏️ Editar producto</h3>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem" }}>
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Nombre</label>
          <UITextInput
            placeholder="Nombre del producto"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <label style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Cantidad</label>
          <UITextInput
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            min={1}
          />
        </div>

        <div>
          <label style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Medida</label>
          <UISelect value={unit} onChange={(e) => setUnit(e.target.value as ShoppingItemUnit)}>
            {UNITS.map((u) => (
              <option key={u.value} value={u.value}>{u.label}</option>
            ))}
          </UISelect>
        </div>

        <div>
          <label style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Categoría</label>
          <UISelect value={category} onChange={(e) => setCategory(e.target.value)}>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.name}>{cat.icon} {cat.name}</option>
            ))}
          </UISelect>
        </div>
      </div>

      {/* Toggle de modo de precio */}
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button
          onClick={() => { setPriceMode("unitario"); setPrice(String(item.actualPrice ?? item.estimatedPrice)); }}
          style={{
            flex: 1,
            padding: "0.4rem",
            borderRadius: "6px",
            border: "1px solid var(--border-color)",
            background: priceMode === "unitario" ? "var(--btn-primary-bg)" : "transparent",
            color: priceMode === "unitario" ? "var(--btn-text-color)" : "var(--text-primary)",
            fontSize: "0.8rem",
            cursor: "pointer",
            fontWeight: priceMode === "unitario" ? "bold" : "normal",
          }}
        >
          Precio unitario
        </button>
        <button
          onClick={() => { setPriceMode("total"); setPrice(String((item.actualPrice ?? item.estimatedPrice) * item.quantity)); }}
          style={{
            flex: 1,
            padding: "0.4rem",
            borderRadius: "6px",
            border: "1px solid var(--border-color)",
            background: priceMode === "total" ? "var(--btn-primary-bg)" : "transparent",
            color: priceMode === "total" ? "var(--btn-text-color)" : "var(--text-primary)",
            fontSize: "0.8rem",
            cursor: "pointer",
            fontWeight: priceMode === "total" ? "bold" : "normal",
          }}
        >
          Precio total
        </button>
      </div>

      {/* Input de precio */}
      <div>
        <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: "bold" }}>
          {item.inCart ? "Precio real" : "Precio estimado"} ({priceMode === "unitario" ? "unitario" : "total"})
        </label>
        <UITextInput
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          min={0}
          step={0.01}
          style={{ fontSize: "1.1rem", padding: "0.7rem", marginTop: "0.3rem" }}
        />
        <div style={{ textAlign: "right", marginTop: "0.25rem" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
            {priceMode === "unitario"
              ? `Total: $${totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : `Unitario: $${unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            }
          </span>
        </div>
      </div>

      {/* Botones */}
      <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", marginTop: "0.5rem" }}>
        <UIButton
          variant="danger"
          onClick={onRemove}
          style={{ fontSize: "0.8rem" }}
        >
          Eliminar
        </UIButton>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <UIButton onClick={onCancel} variant="default">Cancelar</UIButton>
          <UIButton variant="primary" onClick={handleConfirm}>Guardar</UIButton>
        </div>
      </div>
    </div>
  );
};

export default EditTrip;
