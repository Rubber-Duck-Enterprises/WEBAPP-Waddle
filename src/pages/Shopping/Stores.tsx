import React, { useState, useMemo } from "react";
import { useShoppingStore } from "@/stores/shoppingStore";
import { useModal } from "@/context/ModalContext";
import { usePopUp } from "@/context/PopUpContext";
import ShoppingLayout from "@/layouts/ShoppingLayout";
import UIButton from "@/components/UI/UIButton";
import UITextInput from "@/components/UI/UITextInput";

const STORE_EMOJIS_QUICK = ["🏬", "🛒", "🏪"];
const CATEGORY_EMOJIS_QUICK = ["📦", "🥛", "👕"];

const ShoppingStores: React.FC = () => {
  const { stores, trips, categories, addStore, updateStore, removeStore, addCategory, removeCategory } = useShoppingStore();
  const { showModal, hideModal } = useModal();
  const { showPopUp } = usePopUp();

  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("🏬");
  const [searchProduct, setSearchProduct] = useState("");
  const [newCatName, setNewCatName] = useState("");
  const [newCatIcon, setNewCatIcon] = useState("📦");

  // --- Historial de precios por producto y tienda ---
  const priceHistory = useMemo(() => {
    const map: Record<string, Record<string, { prices: number[]; lastDate: string }>> = {};
    // map[productName][storeName] = { prices: [...], lastDate }

    trips
      .filter((t) => t.status === "completed")
      .forEach((trip) => {
        trip.items
          .filter((i) => i.inCart && !i.removed && i.actualPrice !== undefined)
          .forEach((item) => {
            const productKey = item.name.toLowerCase().trim();
            if (!map[productKey]) map[productKey] = {};
            if (!map[productKey][trip.store]) {
              map[productKey][trip.store] = { prices: [], lastDate: "" };
            }
            map[productKey][trip.store].prices.push(item.actualPrice!);
            const date = trip.completedAt || trip.createdAt;
            if (date > map[productKey][trip.store].lastDate) {
              map[productKey][trip.store].lastDate = date;
            }
          });
      });

    return map;
  }, [trips]);

  // --- Sugerencias: encontrar la tienda más barata para cada producto ---
  const suggestions = useMemo(() => {
    const result: {
      product: string;
      bestStore: string;
      bestAvgPrice: number;
      otherStores: { store: string; avgPrice: number }[];
    }[] = [];

    Object.entries(priceHistory).forEach(([product, storeMap]) => {
      const storeEntries = Object.entries(storeMap).map(([store, data]) => ({
        store,
        avgPrice: data.prices.reduce((a, b) => a + b, 0) / data.prices.length,
        lastDate: data.lastDate,
      }));

      if (storeEntries.length < 2) return; // Solo sugerir si hay datos de 2+ tiendas

      storeEntries.sort((a, b) => a.avgPrice - b.avgPrice);
      const best = storeEntries[0];
      const others = storeEntries.slice(1);

      result.push({
        product,
        bestStore: best.store,
        bestAvgPrice: best.avgPrice,
        otherStores: others,
      });
    });

    return result.sort((a, b) => {
      // Ordenar por mayor diferencia de ahorro
      const savingsA = a.otherStores[0] ? a.otherStores[0].avgPrice - a.bestAvgPrice : 0;
      const savingsB = b.otherStores[0] ? b.otherStores[0].avgPrice - b.bestAvgPrice : 0;
      return savingsB - savingsA;
    });
  }, [priceHistory]);

  // Filtrar sugerencias por búsqueda
  const filteredSuggestions = searchProduct
    ? suggestions.filter((s) => s.product.includes(searchProduct.toLowerCase()))
    : suggestions;

  // --- Buscar precios de un producto específico ---
  const productPrices = useMemo(() => {
    if (!searchProduct.trim()) return null;
    const key = searchProduct.toLowerCase().trim();
    const storeData = priceHistory[key];
    if (!storeData) return null;

    return Object.entries(storeData)
      .map(([store, data]) => ({
        store,
        avgPrice: data.prices.reduce((a, b) => a + b, 0) / data.prices.length,
        minPrice: Math.min(...data.prices),
        maxPrice: Math.max(...data.prices),
        count: data.prices.length,
        lastDate: data.lastDate,
      }))
      .sort((a, b) => a.avgPrice - b.avgPrice);
  }, [searchProduct, priceHistory]);

  const handleAddStore = () => {
    if (!newName.trim()) {
      showPopUp("DANGER", "Escribe el nombre de la tienda.");
      return;
    }
    if (stores.some((s) => s.name.toLowerCase() === newName.trim().toLowerCase())) {
      showPopUp("DANGER", "Ya existe una tienda con ese nombre.");
      return;
    }
    addStore(newName.trim(), newIcon);
    setNewName("");
    setNewIcon("🏬");
    showPopUp("SUCCESS", "Tienda agregada.");
  };

  const handleAddCategory = () => {
    if (!newCatName.trim()) {
      showPopUp("DANGER", "Escribe el nombre de la categoría.");
      return;
    }
    if (categories.some((c) => c.name.toLowerCase() === newCatName.trim().toLowerCase())) {
      showPopUp("DANGER", "Ya existe esa categoría.");
      return;
    }
    addCategory(newCatName.trim(), newCatIcon);
    setNewCatName("");
    setNewCatIcon("📦");
    showPopUp("SUCCESS", "Categoría agregada.");
  };

  const handleDeleteCategory = (id: string, name: string) => {
    showModal(
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", textAlign: "center" }}>
        <h3 style={{ color: "var(--text-primary)" }}>⚠️ Eliminar categoría</h3>
        <p style={{ color: "var(--text-secondary)" }}>
          ¿Eliminar &quot;{name}&quot;? Los productos con esta categoría mantendrán su historial.
        </p>
        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
          <UIButton variant="default" onClick={hideModal}>Cancelar</UIButton>
          <UIButton
            variant="danger"
            onClick={() => {
              removeCategory(id);
              hideModal();
              showPopUp("INFO", `${name} eliminada.`);
            }}
          >
            Eliminar
          </UIButton>
        </div>
      </div>
    );
  };

  const handleDeleteStore = (id: string, name: string) => {
    showModal(
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", textAlign: "center" }}>
        <h3 style={{ color: "var(--text-primary)" }}>⚠️ Eliminar tienda</h3>
        <p style={{ color: "var(--text-secondary)" }}>
          ¿Eliminar &quot;{name}&quot;? El historial de compras asociado se conservará.
        </p>
        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
          <UIButton variant="default" onClick={hideModal}>Cancelar</UIButton>
          <UIButton
            variant="danger"
            onClick={() => {
              removeStore(id);
              hideModal();
              showPopUp("INFO", `${name} eliminada.`);
            }}
          >
            Eliminar
          </UIButton>
        </div>
      </div>
    );
  };

  const handleEditStore = (id: string, currentName: string, currentIcon: string) => {
    let editName = currentName;
    let editIcon = currentIcon;

    const EditModal = () => {
      const [name, setName] = useState(currentName);
      const [icon, setIcon] = useState(currentIcon);

      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <h3 style={{ color: "var(--text-primary)" }}>✏️ Editar tienda</h3>
          <UITextInput
            placeholder="Nombre de la tienda"
            value={name}
            onChange={(e) => { setName(e.target.value); editName = e.target.value; }}
          />
          <div>
            <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Icono</label>
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.3rem", alignItems: "center" }}>
              {STORE_EMOJIS_QUICK.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => { setIcon(emoji); editIcon = emoji; }}
                  style={{
                    fontSize: "1.5rem",
                    padding: "0.3rem",
                    border: icon === emoji ? "2px solid var(--btn-primary-bg)" : "2px solid transparent",
                    borderRadius: "8px",
                    background: "var(--surface)",
                    cursor: "pointer",
                  }}
                >
                  {emoji}
                </button>
              ))}
              <UITextInput
                value={icon}
                onChange={(e) => { setIcon(e.target.value); editIcon = e.target.value; }}
                style={{ width: "3rem", textAlign: "center", fontSize: "1.3rem", padding: "0.3rem" }}
                maxLength={2}
                placeholder="🏬"
              />
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
            <UIButton variant="default" onClick={hideModal}>Cancelar</UIButton>
            <UIButton
              variant="primary"
              onClick={() => {
                if (!editName.trim()) {
                  showPopUp("DANGER", "El nombre no puede estar vacío.");
                  return;
                }
                updateStore(id, { name: editName.trim(), icon: editIcon });
                hideModal();
                showPopUp("SUCCESS", "Tienda actualizada.");
              }}
            >
              Guardar
            </UIButton>
          </div>
        </div>
      );
    };

    showModal(<EditModal />);
  };

  return (
    <ShoppingLayout>
      <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <h2 style={{ fontSize: "1.2rem", fontWeight: "bold", color: "var(--text-primary)" }}>
          🏪 Configuración de tiendas
        </h2>

        {/* Agregar tienda */}
        <div
          style={{
            background: "var(--surface)",
            borderRadius: "12px",
            padding: "1rem",
            border: "1px solid var(--border-color)",
            boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
          }}
        >
          <h3 style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "0.75rem" }}>
            Agregar tienda
          </h3>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.75rem" }}>
            <UITextInput
              placeholder="Nombre de la tienda"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              style={{ flex: 1 }}
            />
            <UIButton variant="primary" onClick={handleAddStore}>
              +
            </UIButton>
          </div>
          <div>
            <label style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Icono:</label>
            <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.3rem", alignItems: "center" }}>
              {STORE_EMOJIS_QUICK.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => setNewIcon(emoji)}
                  style={{
                    fontSize: "1.3rem",
                    padding: "0.2rem",
                    border: newIcon === emoji ? "2px solid var(--btn-primary-bg)" : "2px solid transparent",
                    borderRadius: "6px",
                    background: "var(--surface)",
                    cursor: "pointer",
                  }}
                >
                  {emoji}
                </button>
              ))}
              <UITextInput
                value={newIcon}
                onChange={(e) => setNewIcon(e.target.value)}
                style={{ width: "3rem", textAlign: "center", fontSize: "1.2rem", padding: "0.2rem" }}
                maxLength={2}
                placeholder="🏬"
              />
            </div>
          </div>
        </div>

        {/* Lista de tiendas */}
        <div
          style={{
            background: "var(--surface)",
            borderRadius: "12px",
            padding: "1rem",
            border: "1px solid var(--border-color)",
            boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
          }}
        >
          <h3 style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "0.75rem" }}>
            Mis tiendas ({stores.length})
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {stores.map((store) => {
              const storeTrips = trips.filter((t) => t.store === store.name && t.status === "completed");
              const totalSpent = storeTrips.reduce((acc, t) => acc + t.actualTotal, 0);

              return (
                <div
                  key={store.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0.6rem",
                    borderRadius: "8px",
                    border: "1px solid var(--border-color)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontSize: "1.3rem" }}>{store.icon}</span>
                    <div>
                      <div style={{ fontWeight: "bold", color: "var(--text-primary)", fontSize: "0.9rem" }}>
                        {store.name}
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>
                        {storeTrips.length} compras · ${totalSpent.toLocaleString()} gastado
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "0.3rem" }}>
                    <button
                      onClick={() => handleEditStore(store.id, store.name, store.icon)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "1rem",
                      }}
                      aria-label={`Editar ${store.name}`}
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDeleteStore(store.id, store.name)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "1rem",
                      }}
                      aria-label={`Eliminar ${store.name}`}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
            {stores.length === 0 && (
              <p style={{ textAlign: "center", color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                No hay tiendas configuradas.
              </p>
            )}
          </div>
        </div>

        {/* Comparador de precios / Sugerencias */}
        <div
          style={{
            background: "var(--surface)",
            borderRadius: "12px",
            padding: "1rem",
            border: "1px solid var(--border-color)",
            boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
          }}
        >
          <h3 style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "0.75rem" }}>
            🏷️ Categorías ({categories.length})
          </h3>

          {/* Agregar categoría */}
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.75rem" }}>
            <UITextInput
              placeholder="Nueva categoría (ej: Ropa, Electrónica...)"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              style={{ flex: 1 }}
            />
            <UIButton variant="primary" onClick={handleAddCategory}>
              +
            </UIButton>
          </div>
          <div style={{ marginBottom: "0.75rem" }}>
            <label style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Icono:</label>
            <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.3rem", alignItems: "center" }}>
              {CATEGORY_EMOJIS_QUICK.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => setNewCatIcon(emoji)}
                  style={{
                    fontSize: "1.1rem",
                    padding: "0.15rem",
                    border: newCatIcon === emoji ? "2px solid var(--btn-primary-bg)" : "2px solid transparent",
                    borderRadius: "6px",
                    background: "var(--surface)",
                    cursor: "pointer",
                  }}
                >
                  {emoji}
                </button>
              ))}
              <UITextInput
                value={newCatIcon}
                onChange={(e) => setNewCatIcon(e.target.value)}
                style={{ width: "3rem", textAlign: "center", fontSize: "1.1rem", padding: "0.15rem" }}
                maxLength={2}
                placeholder="📦"
              />
            </div>
          </div>

          {/* Lista de categorías */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
            {categories.map((cat) => (
              <div
                key={cat.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.3rem",
                  padding: "0.3rem 0.6rem",
                  borderRadius: "20px",
                  border: "1px solid var(--border-color)",
                  fontSize: "0.8rem",
                  color: "var(--text-primary)",
                }}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
                <button
                  onClick={() => handleDeleteCategory(cat.id, cat.name)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--text-secondary)",
                    fontSize: "0.75rem",
                    marginLeft: "0.2rem",
                  }}
                  aria-label={`Eliminar ${cat.name}`}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Comparador de precios / Sugerencias */}
        <div
          style={{
            background: "var(--surface)",
            borderRadius: "12px",
            padding: "1rem",
            border: "1px solid var(--border-color)",
            boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
          }}
        >
          <h3 style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "0.75rem" }}>
            💡 ¿Dónde comprar más barato?
          </h3>
          <UITextInput
            placeholder="Buscar producto (ej: Leche, Pan, Arroz...)"
            value={searchProduct}
            onChange={(e) => setSearchProduct(e.target.value)}
            style={{ marginBottom: "0.75rem" }}
          />

          {/* Resultado de búsqueda específica */}
          {productPrices && productPrices.length > 0 && (
            <div style={{ marginBottom: "1rem" }}>
              <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
                Precios de &quot;{searchProduct}&quot; por tienda:
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                {productPrices.map((entry, idx) => (
                  <div
                    key={entry.store}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "0.5rem",
                      borderRadius: "6px",
                      background: idx === 0 ? "rgba(76, 175, 80, 0.1)" : "transparent",
                      border: idx === 0 ? "1px solid #4caf5044" : "1px solid var(--border-color)",
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: idx === 0 ? "bold" : "normal", color: "var(--text-primary)" }}>
                        {idx === 0 && "🏆 "}{entry.store}
                      </span>
                      <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>
                        {entry.count} compras · Último: {new Date(entry.lastDate).toLocaleDateString("es-MX")}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: "bold", color: idx === 0 ? "#4caf50" : "var(--text-primary)" }}>
                        ${entry.avgPrice.toFixed(2)}
                      </div>
                      <div style={{ fontSize: "0.65rem", color: "var(--text-secondary)" }}>
                        Min: ${entry.minPrice} · Max: ${entry.maxPrice}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {searchProduct && productPrices === null && (
            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", textAlign: "center", padding: "0.5rem" }}>
              No hay datos de precio para &quot;{searchProduct}&quot;. Completa compras para generar historial.
            </p>
          )}

          {/* Sugerencias automáticas */}
          {!searchProduct && suggestions.length > 0 && (
            <div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
                Sugerencias basadas en tu historial:
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {filteredSuggestions.slice(0, 10).map((suggestion) => {
                  const savings = suggestion.otherStores[0]
                    ? suggestion.otherStores[0].avgPrice - suggestion.bestAvgPrice
                    : 0;

                  return (
                    <div
                      key={suggestion.product}
                      style={{
                        padding: "0.6rem",
                        borderRadius: "8px",
                        border: "1px solid var(--border-color)",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <span style={{ fontWeight: "bold", color: "var(--text-primary)", textTransform: "capitalize" }}>
                            {suggestion.product}
                          </span>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                            Más barato en <strong>{suggestion.bestStore}</strong> → ${suggestion.bestAvgPrice.toFixed(2)}
                          </div>
                        </div>
                        {savings > 0 && (
                          <span
                            style={{
                              fontSize: "0.75rem",
                              fontWeight: "bold",
                              color: "#4caf50",
                              background: "rgba(76, 175, 80, 0.1)",
                              padding: "0.2rem 0.4rem",
                              borderRadius: "4px",
                            }}
                          >
                            Ahorra ${savings.toFixed(2)}
                          </span>
                        )}
                      </div>
                      {suggestion.otherStores.length > 0 && (
                        <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)", marginTop: "0.3rem" }}>
                          {suggestion.otherStores.map((s) => (
                            <span key={s.store} style={{ marginRight: "0.5rem" }}>
                              {s.store}: ${s.avgPrice.toFixed(2)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {!searchProduct && suggestions.length === 0 && (
            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", textAlign: "center", padding: "0.5rem" }}>
              Completa compras en diferentes tiendas para ver sugerencias de dónde comprar más barato cada producto.
            </p>
          )}
        </div>
      </div>
    </ShoppingLayout>
  );
};

export default ShoppingStores;
