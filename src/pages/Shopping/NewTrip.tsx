import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useShoppingStore } from "@/stores/shoppingStore";
import { useModal } from "@/context/ModalContext";
import { usePopUp } from "@/context/PopUpContext";
import ShoppingLayout from "@/layouts/ShoppingLayout";
import UIButton from "@/components/UI/UIButton";
import UITextInput from "@/components/UI/UITextInput";
import UISelect from "@/components/UI/UISelect";
import { getProductModal } from "@/components/Modal/Presets/Shopping/ProductModal";
import type { ShoppingItemUnit } from "@/types/shopping";

interface PlanItem {
  id: string;
  name: string;
  quantity: number;
  unit: ShoppingItemUnit;
  category: string;
  estimatedPrice: number;
  selected: boolean;
}

type FilterTab = "todos" | "en_lista" | "por_agregar" | "buscar";

const CURRENCIES = [
  { code: "MXN", symbol: "$", label: "MXN $" },
  { code: "USD", symbol: "$", label: "USD $" },
  { code: "EUR", symbol: "€", label: "EUR €" },
  { code: "COP", symbol: "$", label: "COP $" },
  { code: "ARS", symbol: "$", label: "ARS $" },
  { code: "CLP", symbol: "$", label: "CLP $" },
  { code: "PEN", symbol: "S/", label: "PEN S/" },
];

const NewTrip: React.FC = () => {
  const navigate = useNavigate();
  const { showModal, hideModal } = useModal();
  const { showPopUp } = usePopUp();
  const { lists, stores, trips, monthlyBudget, createTrip, addList, addItemToList } = useShoppingStore();

  const [selectedListId, setSelectedListId] = useState<string>("");
  const [newListName, setNewListName] = useState("");
  const [selectedStore, setSelectedStore] = useState("");
  const [customBudget, setCustomBudget] = useState("");
  const [currency, setCurrency] = useState("MXN");
  const [items, setItems] = useState<PlanItem[]>([]);
  const [filter, setFilter] = useState<FilterTab>("todos");
  const [searchTerm, setSearchTerm] = useState("");

  // --- Tienda más barata por producto (del historial) ---
  const cheapestStoreByProduct = useMemo(() => {
    const map: Record<string, Record<string, number[]>> = {};
    // map[productKey][storeName] = [prices...]

    trips
      .filter((t) => t.status === "completed")
      .forEach((trip) => {
        trip.items
          .filter((i) => i.inCart && !i.removed && i.actualPrice !== undefined)
          .forEach((item) => {
            const key = item.name.toLowerCase().trim();
            if (!map[key]) map[key] = {};
            if (!map[key][trip.store]) map[key][trip.store] = [];
            map[key][trip.store].push(item.actualPrice!);
          });
      });

    // Para cada producto, encontrar la tienda con menor precio promedio
    const result: Record<string, string> = {};
    Object.entries(map).forEach(([product, storeMap]) => {
      let bestStore = "";
      let bestAvg = Infinity;
      Object.entries(storeMap).forEach(([store, prices]) => {
        const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
        if (avg < bestAvg) {
          bestAvg = avg;
          bestStore = store;
        }
      });
      if (bestStore) result[product] = bestStore;
    });

    return result;
  }, [trips]);

  // Calcular presupuesto restante del mes
  const currentMonth = new Date().toISOString().slice(0, 7);
  const usedThisMonth = useMemo(() => {
    return trips
      .filter((t) => t.status === "completed" && t.completedAt?.startsWith(currentMonth))
      .reduce((acc, t) => acc + t.actualTotal, 0);
  }, [trips, currentMonth]);

  const defaultBudget = monthlyBudget > 0 ? monthlyBudget - usedThisMonth : 0;

  // El presupuesto efectivo: usa el custom si se escribió, sino el restante del mes
  const effectiveBudget = customBudget ? Number(customBudget) : defaultBudget;

  // Recopilar todos los productos del historial (de todas las listas + trips completados)
  const allKnownProducts = useMemo(() => {
    const productMap: Record<string, PlanItem> = {};

    // De las listas guardadas
    lists.forEach((list) => {
      list.items.forEach((item) => {
        const key = item.name.toLowerCase().trim();
        if (!productMap[key]) {
          productMap[key] = {
            id: item.id,
            name: item.name,
            quantity: 1,
            unit: item.unit,
            category: item.category,
            estimatedPrice: item.lastPrice,
            selected: false,
          };
        } else {
          // Actualizar precio si es más reciente
          if (item.lastPrice > 0) {
            productMap[key].estimatedPrice = item.lastPrice;
          }
        }
      });
    });

    // De trips completados (para productos que no están en listas)
    trips
      .filter((t) => t.status === "completed")
      .forEach((trip) => {
        trip.items
          .filter((i) => i.inCart && !i.removed)
          .forEach((item) => {
            const key = item.name.toLowerCase().trim();
            if (!productMap[key]) {
              productMap[key] = {
                id: `hist-${key}`,
                name: item.name,
                quantity: 1,
                unit: item.unit,
                category: item.category,
                estimatedPrice: item.actualPrice ?? item.estimatedPrice,
                selected: false,
              };
            } else if (item.actualPrice && item.actualPrice > 0) {
              productMap[key].estimatedPrice = item.actualPrice;
            }
          });
      });

    return Object.values(productMap);
  }, [lists, trips]);

  // Cargar items al seleccionar una lista
  const loadListItems = (listId: string) => {
    const list = lists.find((l) => l.id === listId);
    if (!list) return;
    const planItems: PlanItem[] = list.items.map((item) => ({
      id: item.id,
      name: item.name,
      quantity: 1,
      unit: item.unit,
      category: item.category,
      estimatedPrice: item.lastPrice,
      selected: false,
    }));
    setItems(planItems);

    // Cargar el presupuesto del último trip de esta lista
    const lastTrip = [...trips]
      .filter((t) => t.listId === listId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
    if (lastTrip && lastTrip.budget > 0) {
      setCustomBudget(String(lastTrip.budget));
    }
  };

  // Si no hay lista seleccionada, mostrar todos los productos conocidos
  // Siempre usar allKnownProducts como base cuando no hay lista, para no ocultar productos al seleccionar
  // También incluir productos agregados manualmente que no estén en allKnownProducts
  const displayItems = useMemo(() => {
    if (selectedListId) return items;
    const knownIds = new Set(allKnownProducts.map((p) => p.id));
    const manuallyAdded = items.filter((i) => !knownIds.has(i.id));
    return [...manuallyAdded, ...allKnownProducts];
  }, [selectedListId, items, allKnownProducts]);

  const handleListChange = (value: string) => {
    setSelectedListId(value);
    if (value) {
      loadListItems(value);
    } else {
      setItems([]);
    }
  };

  const toggleItem = (id: string) => {
    if (selectedListId) {
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, selected: !i.selected } : i))
      );
    } else {
      // Sin lista: trabajar sobre displayItems
      setItems((prev) => {
        const existing = prev.find((i) => i.id === id);
        if (existing) {
          return prev.map((i) => (i.id === id ? { ...i, selected: !i.selected } : i));
        }
        // Si no está en items local, agregar desde allKnownProducts
        const fromAll = allKnownProducts.find((i) => i.id === id);
        if (fromAll) {
          return [...prev, { ...fromAll, selected: true }];
        }
        return prev;
      });
    }
  };

  const updateQuantity = (id: string, delta: number) => {
    const updateFn = (prev: PlanItem[]) =>
      prev.map((i) => (i.id === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i));

    if (selectedListId || items.find((i) => i.id === id)) {
      setItems(updateFn);
    } else {
      // Agregar a items si viene de allKnownProducts
      const fromAll = allKnownProducts.find((i) => i.id === id);
      if (fromAll) {
        setItems((prev) => [...prev, { ...fromAll, quantity: Math.max(1, 1 + delta) }]);
      }
    }
  };

  // Items seleccionados (de items locales + los de allKnownProducts que se togglearon)
  const selectedItems = useMemo(() => {
    if (selectedListId) {
      return items.filter((i) => i.selected);
    }
    // Merge: items locales seleccionados
    return items.filter((i) => i.selected);
  }, [items, selectedListId]);

  const estimatedTotal = selectedItems.reduce((acc, i) => acc + i.estimatedPrice * i.quantity, 0);
  const remainingAfterSelection = effectiveBudget - estimatedTotal;
  const isOverBudget = effectiveBudget > 0 && estimatedTotal > effectiveBudget;

  const filteredItems = useMemo(() => {
    const source = displayItems;
    let result: PlanItem[];

    // Merge local selected state onto displayItems
    const localSelectedIds = new Set(items.filter((i) => i.selected).map((i) => i.id));
    const localQuantities: Record<string, number> = {};
    items.forEach((i) => { localQuantities[i.id] = i.quantity; });

    const mergedSource = source.map((item) => ({
      ...item,
      selected: localSelectedIds.has(item.id) || item.selected,
      quantity: localQuantities[item.id] ?? item.quantity,
    }));

    switch (filter) {
      case "en_lista":
        result = mergedSource.filter((i) => i.selected);
        break;
      case "por_agregar":
        result = mergedSource.filter((i) => !i.selected);
        break;
      case "buscar":
        result = mergedSource.filter((i) =>
          i.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        break;
      default:
        result = mergedSource;
    }
    // Seleccionados siempre arriba
    return [...result].sort((a, b) => (b.selected ? 1 : 0) - (a.selected ? 1 : 0));
  }, [displayItems, items, filter, searchTerm]);

  const openAddProduct = () => {
    showModal(
      getProductModal({
        onCancel: hideModal,
        onConfirm: (product) => {
          const newItem: PlanItem = {
            id: `new-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            name: product.name,
            quantity: product.quantity,
            unit: product.unit,
            category: product.category,
            estimatedPrice: product.price,
            selected: true,
          };
          setItems((prev) => [newItem, ...prev]);
          hideModal();
        },
      })
    );
  };

  const handleFinishList = () => {
    if (selectedItems.length === 0) {
      showPopUp("DANGER", "Selecciona al menos un producto.");
      return;
    }
    if (!selectedStore) {
      showPopUp("DANGER", "Selecciona una tienda.");
      return;
    }

    // Crear/obtener la lista
    let listId = selectedListId;
    let listName = lists.find((l) => l.id === listId)?.name || newListName;

    if (!listId && newListName.trim()) {
      listId = addList(newListName.trim());
      listName = newListName.trim();
      selectedItems.forEach((item) => {
        addItemToList(listId, {
          name: item.name,
          category: item.category,
          unit: item.unit,
          lastPrice: item.estimatedPrice,
        });
      });
    }

    // Si no hay nombre de lista, crear una auto
    if (!listName) {
      const autoName = `Compra ${new Date().toLocaleDateString("es-MX")}`;
      listId = addList(autoName);
      listName = autoName;
      selectedItems.forEach((item) => {
        addItemToList(listId, {
          name: item.name,
          category: item.category,
          unit: item.unit,
          lastPrice: item.estimatedPrice,
        });
      });
    }

    // Mostrar confirmación
    showModal(
      <ConfirmationModal
        itemCount={selectedItems.length}
        estimatedTotal={estimatedTotal}
        budget={effectiveBudget}
        isOverBudget={isOverBudget}
        currency={CURRENCIES.find((c) => c.code === currency)?.symbol || "$"}
        onCancel={hideModal}
        onConfirm={() => {
          const tripId = createTrip({
            listId,
            listName,
            store: selectedStore,
            budget: effectiveBudget,
            items: selectedItems.map((i) => ({
              name: i.name,
              quantity: i.quantity,
              unit: i.unit,
              category: i.category,
              estimatedPrice: i.estimatedPrice,
            })),
          });
          hideModal();
          showPopUp("SUCCESS", "¡Compra creada!");
          navigate(`/shopping/trip/${tripId}`);
        }}
      />
    );
  };

  const currencySymbol = CURRENCIES.find((c) => c.code === currency)?.symbol || "$";

  return (
    <ShoppingLayout>
      <div style={{ padding: "1rem", paddingBottom: "8rem" }}>
        {/* Header: Presupuesto restante (se actualiza con selección) */}
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
              color: effectiveBudget === 0
                ? "var(--text-primary)"
                : isOverBudget ? "#f44336" : "#4caf50",
            }}
          >
            {effectiveBudget > 0
              ? `${currencySymbol}${remainingAfterSelection.toLocaleString()}`
              : `${currencySymbol}—`}
          </span>
        </div>

        {/* Campos: Lista, Presupuesto + Moneda, Tienda */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", marginBottom: "1rem" }}>
          {/* Lista */}
          <div>
            <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Lista</label>
            <UISelect value={selectedListId} onChange={(e) => handleListChange(e.target.value)}>
              <option value="">Todos los productos</option>
              {lists.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </UISelect>
            {!selectedListId && (
              <UITextInput
                placeholder="Nombre de lista nueva (opcional)"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                style={{ marginTop: "0.4rem" }}
              />
            )}
          </div>

          {/* Presupuesto + Moneda */}
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Presupuesto</label>
              <UITextInput
                type="number"
                placeholder={effectiveBudget > 0 ? String(effectiveBudget) : "Sin límite"}
                value={customBudget}
                onChange={(e) => setCustomBudget(e.target.value)}
                min={0}
              />
            </div>
            <div style={{ width: "100px" }}>
              <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Moneda</label>
              <UISelect value={currency} onChange={(e) => setCurrency(e.target.value)}>
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.label}</option>
                ))}
              </UISelect>
            </div>
          </div>

          {/* Tienda */}
          <div>
            <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Tienda</label>
            <UISelect value={selectedStore} onChange={(e) => setSelectedStore(e.target.value)}>
              <option value="">Selecciona tienda</option>
              {stores.map((s) => (
                <option key={s.id} value={s.name}>{s.icon} {s.name}</option>
              ))}
            </UISelect>
          </div>
        </div>

        {/* Filtros */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem", overflowX: "auto" }}>
          {(["todos", "en_lista", "por_agregar", "buscar"] as FilterTab[]).map((tab) => (
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
              {tab === "en_lista" && "En lista"}
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

        {/* Lista de productos con checkbox y cantidad */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {filteredItems.map((item) => (
            <div
              key={item.id}
              style={{
                background: "var(--card-bg)",
                borderRadius: "10px",
                padding: "0.7rem 0.75rem",
                border: item.selected
                  ? "2px solid #4caf50"
                  : "1px solid var(--border-color)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              {/* Checkbox + info */}
              <div
                style={{ display: "flex", alignItems: "center", gap: "0.6rem", flex: 1, cursor: "pointer" }}
                onClick={() => toggleItem(item.id)}
              >
                <div
                  style={{
                    width: "22px",
                    height: "22px",
                    borderRadius: "50%",
                    border: item.selected ? "2px solid #4caf50" : "2px solid var(--border-color)",
                    background: item.selected ? "#4caf50" : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontSize: "0.7rem",
                    flexShrink: 0,
                  }}
                >
                  {item.selected && "✓"}
                </div>
                <div>
                  <div style={{ fontWeight: "500", color: "var(--text-primary)", fontSize: "0.9rem" }}>
                    {item.name}
                  </div>
                  <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>
                    Precio anterior: {currencySymbol}{item.estimatedPrice}
                  </div>
                  {cheapestStoreByProduct[item.name.toLowerCase().trim()] && (
                    <div style={{ fontSize: "0.65rem", color: "#9e9e9e", marginTop: "0.1rem" }}>
                      Más barato en {cheapestStoreByProduct[item.name.toLowerCase().trim()]}
                    </div>
                  )}
                </div>
              </div>

              {/* Contador de cantidad */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", flexShrink: 0 }}>
                <button
                  onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, -1); }}
                  style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "4px",
                    border: "1px solid var(--border-color)",
                    background: "var(--card-bg)",
                    color: "var(--text-primary)",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  -
                </button>
                <span style={{ minWidth: "20px", textAlign: "center", fontSize: "0.85rem", color: "var(--text-primary)" }}>
                  {item.quantity}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, 1); }}
                  style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "4px",
                    border: "1px solid var(--border-color)",
                    background: "var(--card-bg)",
                    color: "var(--text-primary)",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  +
                </button>
              </div>
            </div>
          ))}

          {filteredItems.length === 0 && (
            <div style={{ textAlign: "center", padding: "1.5rem", color: "var(--text-secondary)" }}>
              <p>No hay productos.</p>
              <p style={{ fontSize: "0.85rem" }}>Agrega tu primer producto para empezar.</p>
            </div>
          )}
        </div>
      </div>

      {/* Botones fijos al fondo */}
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
          flexDirection: "column",
          gap: "0.5rem",
          zIndex: 100,
        }}
      >
        <button
          onClick={openAddProduct}
          style={{
            width: "100%",
            padding: "0.6rem",
            borderRadius: "8px",
            border: "2px dashed var(--border-color)",
            background: "transparent",
            color: "var(--text-secondary)",
            fontSize: "0.85rem",
            cursor: "pointer",
          }}
        >
          + Nuevo producto
        </button>
        <button
          onClick={handleFinishList}
          style={{
            width: "100%",
            padding: "0.7rem",
            borderRadius: "8px",
            border: "none",
            background: "var(--btn-primary-bg)",
            color: "var(--btn-text-color)",
            fontSize: "0.9rem",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          Terminar lista · {currencySymbol}{estimatedTotal.toLocaleString()}
        </button>
      </div>
    </ShoppingLayout>
  );
};

// --- Modal de confirmación ---
const ConfirmationModal: React.FC<{
  itemCount: number;
  estimatedTotal: number;
  budget: number;
  isOverBudget: boolean;
  currency: string;
  onCancel: () => void;
  onConfirm: () => void;
}> = ({ itemCount, estimatedTotal, budget, isOverBudget, currency, onCancel, onConfirm }) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", textAlign: "center" }}>
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem" }}>
        <span
          style={{
            width: "12px",
            height: "12px",
            borderRadius: "50%",
            background: isOverBudget ? "#ff9800" : "#4caf50",
            display: "inline-block",
          }}
        />
        <h3 style={{ color: isOverBudget ? "#ff9800" : "#4caf50", margin: 0 }}>
          {isOverBudget ? "Supera tu presupuesto ⚠️" : "Estás dentro del presupuesto 🎉"}
        </h3>
      </div>
      <p style={{ color: "var(--text-secondary)", margin: 0 }}>
        {itemCount} Producto/s
      </p>
      <p style={{ fontSize: "1.1rem", fontWeight: "bold", color: "var(--text-primary)", margin: 0 }}>
        Total estimado: {currency}{estimatedTotal.toLocaleString()}
      </p>
      {budget > 0 && (
        <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", margin: 0 }}>
          Presupuesto: {currency}{budget.toLocaleString()}
        </p>
      )}
      <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
        <UIButton variant="default" onClick={onCancel}>Cancelar</UIButton>
        <UIButton
          variant="primary"
          onClick={onConfirm}
          style={{ background: isOverBudget ? "#ff9800" : undefined }}
        >
          Confirmar
        </UIButton>
      </div>
    </div>
  );
};

export default NewTrip;
