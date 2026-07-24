import React, { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useShoppingStore } from "@/stores/shoppingStore";
import { useModal } from "@/context/ModalContext";
import { usePopUp } from "@/context/PopUpContext";
import ShoppingLayout from "@/layouts/ShoppingLayout";
import UIButton from "@/components/UI/UIButton";
import UITextInput from "@/components/UI/UITextInput";
import type { ShoppingItem } from "@/types/shopping";

type FilterTab = "todos" | "en_carrito" | "por_agregar" | "buscar";

const ActiveTrip: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const { showModal, hideModal } = useModal();
  const { showPopUp } = usePopUp();
  const {
    trips,
    startTrip,
    completeTrip,
    markItemInCart,
    unmarkItemFromCart,
    removeItemFromTrip,
    addItemToTrip,
  } = useShoppingStore();

  const trip = trips.find((t) => t.id === tripId);
  const [filter, setFilter] = useState<FilterTab>("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [startTime] = useState(() => Date.now());
  const [showSummary, setShowSummary] = useState(false);
  const [elapsedMinutes, setElapsedMinutes] = useState(0);

  // Auto-start
  useEffect(() => {
    if (trip && trip.status === "planning") {
      startTrip(trip.id);
    }
  }, [trip?.id]);

  const activeItems = trip ? trip.items.filter((i) => !i.removed) : [];
  const inCartItems = activeItems.filter((i) => i.inCart);
  const pendingItems = activeItems.filter((i) => !i.inCart);

  const currentTotal = inCartItems.reduce(
    (acc, i) => acc + (i.actualPrice ?? i.estimatedPrice) * i.quantity,
    0
  );
  const remainingBudget = trip ? trip.budget - currentTotal : 0;

  // Agrupar por categoría
  const groupedItems = useMemo(() => {
    let itemsToShow: ShoppingItem[];
    switch (filter) {
      case "en_carrito":
        itemsToShow = inCartItems;
        break;
      case "por_agregar":
        itemsToShow = pendingItems;
        break;
      case "buscar":
        itemsToShow = activeItems.filter((i) =>
          i.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        break;
      default:
        itemsToShow = [...pendingItems, ...inCartItems];
    }

    const groups: Record<string, ShoppingItem[]> = {};
    itemsToShow.forEach((item) => {
      const cat = item.category || "Otro";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    return groups;
  }, [trip?.items, filter, searchTerm]);

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

  // Si ya se completó, mostrar resumen
  if (showSummary || trip.status === "completed") {
    return <TripSummary trip={trip} elapsedMinutes={elapsedMinutes} onClose={() => navigate("/shopping")} />;
  }

  // Modal para agregar al carrito (confirmar precio real)
  const handleAddToCart = (item: ShoppingItem) => {
    showModal(
      <AddToCartModal
        item={item}
        onCancel={hideModal}
        onConfirm={(actualPrice) => {
          markItemInCart(trip.id, item.id, actualPrice);
          hideModal();
          showPopUp("SUCCESS", `${item.name} agregado al carrito.`);
        }}
      />
    );
  };

  const handleRemove = (item: ShoppingItem) => {
    showModal(
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", textAlign: "center" }}>
        <h3 style={{ color: "var(--text-primary)" }}>⚠️ ¡Cuidado!</h3>
        <p style={{ color: "var(--text-secondary)" }}>
          Estás a punto de eliminar &quot;{item.name}&quot; de tu carrito.
        </p>
        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
          <UIButton variant="default" onClick={hideModal}>Cancelar</UIButton>
          <UIButton
            variant="danger"
            onClick={() => {
              removeItemFromTrip(trip.id, item.id);
              hideModal();
              showPopUp("INFO", `${item.name} eliminado.`);
            }}
          >
            Eliminar
          </UIButton>
        </div>
      </div>
    );
  };

  const handleAddMore = () => {
    showModal(
      <AddMoreModal
        tripId={trip.id}
        pendingItems={pendingItems}
        onCancel={hideModal}
        onAddNew={(product) => {
          // Agregar nuevo producto y marcarlo directamente al carrito
          addItemToTrip(trip.id, {
            name: product.name,
            quantity: product.quantity,
            unit: product.unit,
            category: product.category,
            estimatedPrice: product.price,
          });
          // Marcar en carrito el último item agregado
          const updatedTrip = useShoppingStore.getState().trips.find((t) => t.id === trip.id);
          if (updatedTrip) {
            const lastItem = updatedTrip.items[updatedTrip.items.length - 1];
            if (lastItem) {
              markItemInCart(trip.id, lastItem.id, product.price);
            }
          }
          hideModal();
          showPopUp("SUCCESS", `${product.name} agregado al carrito.`);
        }}
        onPickFromList={(item) => {
          // Agregar el producto al trip y abrir modal de precio real
          hideModal();
          addItemToTrip(trip.id, {
            name: item.name,
            quantity: item.quantity,
            unit: item.unit,
            category: item.category,
            estimatedPrice: item.estimatedPrice,
          });
          // Obtener el item recién agregado
          setTimeout(() => {
            const updatedTrip = useShoppingStore.getState().trips.find((t) => t.id === trip.id);
            if (!updatedTrip) return;
            const addedItem = updatedTrip.items[updatedTrip.items.length - 1];
            if (!addedItem) return;
            showModal(
              <AddToCartModal
                item={addedItem}
                onCancel={hideModal}
                onConfirm={(actualPrice) => {
                  markItemInCart(trip.id, addedItem.id, actualPrice);
                  hideModal();
                  showPopUp("SUCCESS", `${addedItem.name} agregado al carrito.`);
                }}
              />
            );
          }, 100);
        }}
      />
    );
  };

  const handleFinishTrip = () => {
    const hasPending = pendingItems.length > 0;
    const elapsed = Math.round((Date.now() - startTime) / 60000);

    showModal(
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", textAlign: "center" }}>
        <div style={{ fontSize: "2rem" }}>{hasPending ? "🟡" : "🎉"}</div>
        <h3 style={{ color: "var(--text-primary)" }}>
          {hasPending ? "¿Te faltó algo?" : "¡Lista completa!"}
        </h3>
        <p style={{ color: "var(--text-secondary)" }}>
          {hasPending
            ? `Todavía hay ${pendingItems.length} producto/s pendientes.`
            : "No quedan productos pendientes."}
        </p>
        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
          <UIButton variant="default" onClick={hideModal}>
            Revisar lista
          </UIButton>
          <UIButton
            variant="primary"
            onClick={() => {
              completeTrip(trip.id);
              hideModal();
              setElapsedMinutes(elapsed);
              setShowSummary(true);
            }}
          >
            Finalizar
          </UIButton>
        </div>
      </div>
    );
  };

  const categoryKeys = Object.keys(groupedItems);

  return (
    <ShoppingLayout>
      <div style={{ padding: "1rem", paddingBottom: "6rem" }}>
        {/* Header: Presupuesto restante */}
        <div
          style={{
            background: "var(--card-bg)",
            borderRadius: "12px",
            padding: "0.75rem 1rem",
            marginBottom: "1rem",
            border: "1px solid var(--border-color)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
            Presupuesto restante
          </span>
          <span
            style={{
              fontWeight: "bold",
              fontSize: "1.3rem",
              color: trip.budget === 0
                ? "var(--text-primary)"
                : remainingBudget < 0 ? "#f44336" : "#4caf50",
            }}
          >
            {trip.budget > 0 ? `$${remainingBudget.toLocaleString()}` : "$—"}
          </span>
        </div>

        {/* Filtros */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem", overflowX: "auto" }}>
          {(["todos", "en_carrito", "por_agregar", "buscar"] as FilterTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              style={{
                padding: "0.35rem 0.7rem",
                borderRadius: "6px",
                border: "1px solid var(--border-color)",
                background: filter === tab ? "var(--btn-primary-bg)" : "transparent",
                color: filter === tab ? "var(--btn-text-color)" : "var(--text-primary)",
                fontSize: "0.8rem",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {tab === "todos" && "Todos"}
              {tab === "en_carrito" && "En carrito"}
              {tab === "por_agregar" && "Por agregar"}
              {tab === "buscar" && "Buscar"}
            </button>
          ))}
        </div>

        {filter === "buscar" && (
          <UITextInput
            placeholder="Buscar producto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ marginBottom: "0.75rem" }}
          />
        )}

        {/* Productos agrupados por categoría */}
        {categoryKeys.length === 0 ? (
          <div style={{ textAlign: "center", padding: "1.5rem", color: "var(--text-secondary)" }}>
            <p>No hay productos en esta vista.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {categoryKeys.map((category) => (
              <div key={category}>
                <div style={{
                  fontSize: "0.8rem",
                  fontWeight: "bold",
                  color: "var(--text-secondary)",
                  marginBottom: "0.4rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}>
                  {category}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {groupedItems[category].map((item) => (
                    <div
                      key={item.id}
                      style={{
                        background: "var(--card-bg)",
                        borderRadius: "10px",
                        padding: "0.7rem 0.75rem",
                        border: item.inCart
                          ? "2px solid #4caf50"
                          : "1px solid var(--border-color)",
                        opacity: item.inCart ? 0.7 : 1,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: "500", color: "var(--text-primary)", fontSize: "0.9rem" }}>
                          {item.inCart && "✓ "}{item.name} x{item.quantity}
                        </div>
                        <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>
                          Precio anterior: ${item.estimatedPrice}
                          {item.inCart && item.actualPrice !== undefined && (
                            <> · Real: ${item.actualPrice}</>
                          )}
                        </div>
                      </div>

                      {!item.inCart && (
                        <div style={{ display: "flex", gap: "0.4rem" }}>
                          <UIButton
                            variant="primary"
                            onClick={() => handleAddToCart(item)}
                            style={{ fontSize: "0.7rem", padding: "0.3rem 0.6rem" }}
                          >
                            Agregar
                          </UIButton>
                          <UIButton
                            variant="danger"
                            onClick={() => handleRemove(item)}
                            style={{ fontSize: "0.7rem", padding: "0.3rem 0.5rem" }}
                          >
                            Borrar
                          </UIButton>
                        </div>
                      )}

                      {item.inCart && (
                        <button
                          onClick={() => unmarkItemFromCart(trip.id, item.id)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "var(--text-secondary)",
                            fontSize: "0.7rem",
                            cursor: "pointer",
                            textDecoration: "underline",
                          }}
                        >
                          Quitar
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Botones fijos */}
      <div
        style={{
          position: "fixed",
          bottom: "calc(56px + var(--safe-area-bottom, 0px))",
          left: 0,
          right: 0,
          padding: "0.75rem 1rem",
          background: "var(--background)",
          borderTop: "1px solid var(--border-color)",
          display: "flex",
          gap: "0.5rem",
          zIndex: 100,
        }}
      >
        <UIButton variant="default" fullWidth onClick={handleAddMore}>
          ¿Algo más?
        </UIButton>
        <UIButton variant="primary" fullWidth onClick={handleFinishTrip}>
          Terminar compra
        </UIButton>
      </div>
    </ShoppingLayout>
  );
};

// --- Modal para confirmar agregar al carrito con precio real ---
const AddToCartModal: React.FC<{
  item: ShoppingItem;
  onCancel: () => void;
  onConfirm: (actualPrice: number) => void;
}> = ({ item, onCancel, onConfirm }) => {
  const [price, setPrice] = useState(String(item.estimatedPrice));
  const { showPopUp } = usePopUp();

  const total = (Number(price) || 0) * item.quantity;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <h3 style={{ color: "var(--text-primary)" }}>⭐ Detalles del producto</h3>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Nombre</label>
          <div style={{
            padding: "0.5rem",
            borderRadius: "8px",
            border: "1px solid var(--border-color)",
            background: "var(--input-bg)",
            color: "var(--text-primary)",
          }}>
            {item.name}
          </div>
        </div>

        <div>
          <label style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Cantidad</label>
          <div style={{
            padding: "0.5rem",
            borderRadius: "8px",
            border: "1px solid var(--border-color)",
            background: "var(--input-bg)",
            color: "var(--text-primary)",
          }}>
            {item.quantity}
          </div>
        </div>

        <div>
          <label style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
            Total (Auto): ${total.toLocaleString()}
          </label>
          <div style={{
            padding: "0.5rem",
            borderRadius: "8px",
            border: "1px solid var(--border-color)",
            background: "var(--input-bg)",
            color: "var(--text-primary)",
          }}>
            ${total.toLocaleString()}
          </div>
        </div>

        <div>
          <label style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Categoría</label>
          <div style={{
            padding: "0.5rem",
            borderRadius: "8px",
            border: "1px solid var(--border-color)",
            background: "var(--input-bg)",
            color: "var(--text-primary)",
          }}>
            {item.category}
          </div>
        </div>

        <div>
          <label style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Medida</label>
          <div style={{
            padding: "0.5rem",
            borderRadius: "8px",
            border: "1px solid var(--border-color)",
            background: "var(--input-bg)",
            color: "var(--text-primary)",
          }}>
            {item.unit}
          </div>
        </div>
      </div>

      {/* Precio real - editable */}
      <div>
        <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: "bold" }}>
          Precio real
        </label>
        <UITextInput
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          min={0}
          step={0.01}
          placeholder={`$${item.estimatedPrice}`}
          style={{ fontSize: "1.1rem", padding: "0.7rem", marginTop: "0.3rem" }}
        />
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "0.5rem" }}>
        <UIButton onClick={onCancel} variant="default">Cancelar</UIButton>
        <UIButton
          variant="primary"
          onClick={() => {
            const p = Number(price);
            if (isNaN(p) || p < 0) {
              showPopUp("DANGER", "Ingresa un precio válido.");
              return;
            }
            onConfirm(p);
          }}
        >
          Aceptar
        </UIButton>
      </div>
    </div>
  );
};

// --- Modal "¿Algo más?" con tabs: Nuevo / Buscar en lista ---
const AddMoreModal: React.FC<{
  tripId: string;
  pendingItems: ShoppingItem[];
  onCancel: () => void;
  onAddNew: (product: { name: string; quantity: number; unit: import("@/types/shopping").ShoppingItemUnit; category: string; price: number }) => void;
  onPickFromList: (item: ShoppingItem) => void;
}> = ({ onCancel, onAddNew, onPickFromList }) => {
  const [tab, setTab] = useState<"buscar" | "nuevo">("buscar");
  const [search, setSearch] = useState("");
  const { categories, lists, trips } = useShoppingStore();

  // Recopilar todos los productos del historial (de todas las listas + trips completados)
  const allKnownProducts = useMemo(() => {
    const productMap: Record<string, { name: string; category: string; unit: import("@/types/shopping").ShoppingItemUnit; lastPrice: number }> = {};

    lists.forEach((list) => {
      list.items.forEach((item) => {
        const key = item.name.toLowerCase().trim();
        if (!productMap[key]) {
          productMap[key] = { name: item.name, category: item.category, unit: item.unit, lastPrice: item.lastPrice };
        } else if (item.lastPrice > 0) {
          productMap[key].lastPrice = item.lastPrice;
        }
      });
    });

    trips
      .filter((t) => t.status === "completed")
      .forEach((trip) => {
        trip.items
          .filter((i) => i.inCart && !i.removed)
          .forEach((item) => {
            const key = item.name.toLowerCase().trim();
            if (!productMap[key]) {
              productMap[key] = { name: item.name, category: item.category, unit: item.unit, lastPrice: item.actualPrice ?? item.estimatedPrice };
            } else if (item.actualPrice && item.actualPrice > 0) {
              productMap[key].lastPrice = item.actualPrice;
            }
          });
      });

    return Object.values(productMap);
  }, [lists, trips]);

  const filteredProducts = search
    ? allKnownProducts.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    : allKnownProducts;

  // Nuevo producto state
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState<import("@/types/shopping").ShoppingItemUnit>("unidad");
  const [category, setCategory] = useState(categories[0]?.name ?? "Otro");
  const [price, setPrice] = useState("");
  const { showPopUp } = usePopUp();

  const handleSubmitNew = () => {
    if (!name.trim()) {
      showPopUp("DANGER", "Escribe el nombre del producto.");
      return;
    }
    onAddNew({
      name: name.trim(),
      quantity: Number(quantity) || 1,
      unit,
      category,
      price: Number(price) || 0,
    });
  };

  const handlePickProduct = (product: { name: string; category: string; unit: import("@/types/shopping").ShoppingItemUnit; lastPrice: number }) => {
    // Crear un ShoppingItem temporal para pasarle al modal de precio
    const tempItem: ShoppingItem = {
      id: `temp-${Date.now()}`,
      name: product.name,
      quantity: 1,
      unit: product.unit,
      category: product.category,
      estimatedPrice: product.lastPrice,
      inCart: false,
      removed: false,
    };
    onPickFromList(tempItem);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxHeight: "70vh" }}>
      <h3 style={{ color: "var(--text-primary)", margin: 0 }}>⭐ Agregar producto</h3>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button
          onClick={() => setTab("buscar")}
          style={{
            flex: 1,
            padding: "0.4rem",
            borderRadius: "6px",
            border: "1px solid var(--border-color)",
            background: tab === "buscar" ? "var(--btn-primary-bg)" : "transparent",
            color: tab === "buscar" ? "var(--btn-text-color)" : "var(--text-primary)",
            fontSize: "0.85rem",
            cursor: "pointer",
            fontWeight: tab === "buscar" ? "bold" : "normal",
          }}
        >
          Buscar
        </button>
        <button
          onClick={() => setTab("nuevo")}
          style={{
            flex: 1,
            padding: "0.4rem",
            borderRadius: "6px",
            border: "1px solid var(--border-color)",
            background: tab === "nuevo" ? "var(--btn-primary-bg)" : "transparent",
            color: tab === "nuevo" ? "var(--btn-text-color)" : "var(--text-primary)",
            fontSize: "0.85rem",
            cursor: "pointer",
            fontWeight: tab === "nuevo" ? "bold" : "normal",
          }}
        >
          Nuevo
        </button>
      </div>

      {tab === "buscar" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <UITextInput
            placeholder="Buscar producto comprado anteriormente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div style={{ maxHeight: "250px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            {filteredProducts.length === 0 ? (
              <p style={{ textAlign: "center", color: "var(--text-secondary)", fontSize: "0.85rem", padding: "1rem" }}>
                {allKnownProducts.length === 0 ? "No hay productos en tu historial." : "No se encontró el producto."}
              </p>
            ) : (
              filteredProducts.map((product, idx) => (
                <div
                  key={`${product.name}-${idx}`}
                  onClick={() => handlePickProduct(product)}
                  style={{
                    padding: "0.6rem",
                    borderRadius: "8px",
                    border: "1px solid var(--border-color)",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: "500", color: "var(--text-primary)", fontSize: "0.85rem" }}>
                      {product.name}
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>
                      Último precio: ${product.lastPrice} · {product.category}
                    </div>
                  </div>
                  <span style={{ fontSize: "0.75rem", color: "var(--btn-primary-bg)", fontWeight: "bold" }}>
                    Agregar →
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {tab === "nuevo" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <UITextInput placeholder="Nombre del producto" value={name} onChange={(e) => setName(e.target.value)} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
            <UITextInput type="number" placeholder="Cantidad" value={quantity} onChange={(e) => setQuantity(e.target.value)} min={1} />
            <UITextInput type="number" placeholder="Precio real" value={price} onChange={(e) => setPrice(e.target.value)} min={0} step={0.01} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{
                padding: "0.5rem",
                borderRadius: "8px",
                border: "1px solid var(--input-border-color)",
                backgroundColor: "var(--input-bg)",
                color: "var(--text-primary)",
              }}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.name}>{c.icon} {c.name}</option>
              ))}
            </select>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value as import("@/types/shopping").ShoppingItemUnit)}
              style={{
                padding: "0.5rem",
                borderRadius: "8px",
                border: "1px solid var(--input-border-color)",
                backgroundColor: "var(--input-bg)",
                color: "var(--text-primary)",
              }}
            >
              <option value="unidad">Unidad</option>
              <option value="kg">Kilogramo</option>
              <option value="g">Gramo</option>
              <option value="L">Litro</option>
              <option value="ml">Mililitro</option>
              <option value="paquete">Paquete</option>
            </select>
          </div>
          <UIButton variant="primary" fullWidth onClick={handleSubmitNew}>
            Agregar al carrito
          </UIButton>
        </div>
      )}

      <UIButton variant="default" fullWidth onClick={onCancel}>
        Cancelar
      </UIButton>
    </div>
  );
};

// --- Pantalla de resumen de compra ---
const TripSummary: React.FC<{
  trip: import("@/types/shopping").ShoppingTrip;
  elapsedMinutes: number;
  onClose: () => void;
}> = ({ trip, elapsedMinutes, onClose }) => {
  const purchasedItems = trip.items.filter((i) => i.inCart && !i.removed);
  const removedItems = trip.items.filter((i) => i.removed);
  const skippedItems = trip.items.filter((i) => !i.inCart && !i.removed);

  const totalEstimated = purchasedItems.reduce((acc, i) => acc + i.estimatedPrice * i.quantity, 0);
  const totalActual = purchasedItems.reduce((acc, i) => acc + (i.actualPrice ?? i.estimatedPrice) * i.quantity, 0);
  const savings = totalEstimated - totalActual;

  // Usar durationMinutes del trip (persistido) o fallback al local
  const duration = trip.durationMinutes ?? elapsedMinutes;

  // Productos más caros de lo esperado
  const moreExpensive = purchasedItems.filter(
    (i) => i.actualPrice !== undefined && i.actualPrice > i.estimatedPrice
  );
  // Productos más baratos de lo esperado
  const cheaper = purchasedItems.filter(
    (i) => i.actualPrice !== undefined && i.actualPrice < i.estimatedPrice
  );

  const budgetDiff = trip.budget > 0 ? trip.budget - totalActual : null;

  return (
    <ShoppingLayout>
      <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {/* Header */}
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "2.5rem" }}>🧾</div>
          <h2 style={{ color: "var(--text-primary)", margin: "0.3rem 0" }}>Resumen de compra</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
            🏬 {trip.store} · {new Date(trip.completedAt || trip.createdAt).toLocaleDateString("es-MX")}
          </p>
        </div>

        {/* Métricas principales */}
        <div
          style={{
            background: "var(--card-bg)",
            borderRadius: "12px",
            padding: "1rem",
            border: "1px solid var(--border-color)",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "0.75rem",
          }}
        >
          <div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>Total gastado</div>
            <div style={{ fontSize: "1.3rem", fontWeight: "bold", color: "var(--text-primary)" }}>
              ${totalActual.toLocaleString()}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>Total estimado</div>
            <div style={{ fontSize: "1.3rem", fontWeight: "bold", color: "var(--text-secondary)" }}>
              ${totalEstimated.toLocaleString()}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>
              {savings >= 0 ? "Ahorraste" : "Gastaste de más"}
            </div>
            <div style={{ fontSize: "1.1rem", fontWeight: "bold", color: savings >= 0 ? "#4caf50" : "#f44336" }}>
              {savings >= 0 ? "+" : "-"}${Math.abs(savings).toLocaleString()}
            </div>
          </div>
          {budgetDiff !== null && (
            <div>
              <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>
                {budgetDiff >= 0 ? "Bajo presupuesto" : "Sobre presupuesto"}
              </div>
              <div style={{ fontSize: "1.1rem", fontWeight: "bold", color: budgetDiff >= 0 ? "#4caf50" : "#f44336" }}>
                {budgetDiff >= 0 ? "+" : "-"}${Math.abs(budgetDiff).toLocaleString()}
              </div>
            </div>
          )}
          <div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>Productos comprados</div>
            <div style={{ fontSize: "1.1rem", fontWeight: "bold", color: "var(--text-primary)" }}>
              {purchasedItems.length}
            </div>
          </div>
          {duration > 0 && (
            <div>
              <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>Tiempo de compra</div>
              <div style={{ fontSize: "1.1rem", fontWeight: "bold", color: "var(--text-primary)" }}>
                {duration < 60 ? `${duration} min` : `${Math.floor(duration / 60)}h ${duration % 60}m`}
              </div>
            </div>
          )}
        </div>

        {/* Productos más caros de lo esperado */}
        {moreExpensive.length > 0 && (
          <div
            style={{
              background: "var(--card-bg)",
              borderRadius: "12px",
              padding: "1rem",
              border: "1px solid #f4433644",
            }}
          >
            <h3 style={{ fontSize: "0.85rem", color: "#f44336", marginBottom: "0.5rem" }}>
              📈 Más caro de lo esperado
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              {moreExpensive.map((item) => (
                <div key={item.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem" }}>
                  <span style={{ color: "var(--text-primary)" }}>{item.name}</span>
                  <span style={{ color: "#f44336" }}>
                    ${item.estimatedPrice} → ${item.actualPrice} (+${(item.actualPrice! - item.estimatedPrice).toFixed(0)})
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Productos más baratos de lo esperado */}
        {cheaper.length > 0 && (
          <div
            style={{
              background: "var(--card-bg)",
              borderRadius: "12px",
              padding: "1rem",
              border: "1px solid #4caf5044",
            }}
          >
            <h3 style={{ fontSize: "0.85rem", color: "#4caf50", marginBottom: "0.5rem" }}>
              📉 Más barato de lo esperado
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              {cheaper.map((item) => (
                <div key={item.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem" }}>
                  <span style={{ color: "var(--text-primary)" }}>{item.name}</span>
                  <span style={{ color: "#4caf50" }}>
                    ${item.estimatedPrice} → ${item.actualPrice} (-${(item.estimatedPrice - item.actualPrice!).toFixed(0)})
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Productos no encontrados / eliminados */}
        {(removedItems.length > 0 || skippedItems.length > 0) && (
          <div
            style={{
              background: "var(--card-bg)",
              borderRadius: "12px",
              padding: "1rem",
              border: "1px solid var(--border-color)",
            }}
          >
            {removedItems.length > 0 && (
              <>
                <h3 style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.4rem" }}>
                  🗑️ Eliminados ({removedItems.length})
                </h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem", marginBottom: removedItems.length > 0 ? "0.5rem" : 0 }}>
                  {removedItems.map((item) => (
                    <span key={item.id} style={{ fontSize: "0.75rem", color: "var(--text-secondary)", padding: "0.2rem 0.4rem", borderRadius: "4px", border: "1px solid var(--border-color)" }}>
                      {item.name}
                    </span>
                  ))}
                </div>
              </>
            )}
            {skippedItems.length > 0 && (
              <>
                <h3 style={{ fontSize: "0.85rem", color: "#ff9800", marginBottom: "0.4rem" }}>
                  ⏭️ No comprados ({skippedItems.length})
                </h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
                  {skippedItems.map((item) => (
                    <span key={item.id} style={{ fontSize: "0.75rem", color: "var(--text-secondary)", padding: "0.2rem 0.4rem", borderRadius: "4px", border: "1px solid #ff980044" }}>
                      {item.name}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Botón cerrar */}
        <UIButton variant="primary" fullWidth onClick={onClose}>
          Volver al inicio
        </UIButton>
      </div>
    </ShoppingLayout>
  );
};

export default ActiveTrip;
