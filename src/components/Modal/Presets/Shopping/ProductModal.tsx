import React, { useState } from "react";
import UITextInput from "@/components/UI/UITextInput";
import UISelect from "@/components/UI/UISelect";
import UIButton from "@/components/UI/UIButton";
import { usePopUp } from "@/context/PopUpContext";
import { useShoppingStore } from "@/stores/shoppingStore";
import type { ShoppingItemUnit } from "@/types/shopping";

interface ProductData {
  name: string;
  quantity: number;
  unit: ShoppingItemUnit;
  category: string;
  price: number;
}

interface Props {
  initialData?: Partial<ProductData>;
  onConfirm: (data: ProductData) => void;
  onCancel: () => void;
}

export const getProductModal = (props: Props) => <ProductModal {...props} />;

const UNITS: { value: ShoppingItemUnit; label: string }[] = [
  { value: "unidad", label: "Unidad" },
  { value: "kg", label: "Kilogramo" },
  { value: "g", label: "Gramo" },
  { value: "L", label: "Litro" },
  { value: "ml", label: "Mililitro" },
  { value: "paquete", label: "Paquete" },
];

const ProductModal: React.FC<Props> = ({ initialData, onConfirm, onCancel }) => {
  const { showPopUp } = usePopUp();
  const { categories } = useShoppingStore();
  const [name, setName] = useState(initialData?.name || "");
  const [quantity, setQuantity] = useState(String(initialData?.quantity || 1));
  const [unit, setUnit] = useState<ShoppingItemUnit>(initialData?.unit || "unidad");
  const [category, setCategory] = useState(initialData?.category || (categories[0]?.name ?? "Otro"));
  const [price, setPrice] = useState(String(initialData?.price || ""));

  const totalAuto = (Number(price) || 0) * (Number(quantity) || 0);

  const handleConfirm = () => {
    if (!name.trim()) {
      showPopUp("DANGER", "Escribe el nombre del producto.");
      return;
    }
    if (Number(quantity) <= 0) {
      showPopUp("DANGER", "La cantidad debe ser mayor a 0.");
      return;
    }
    if (Number(price) < 0) {
      showPopUp("DANGER", "El precio no puede ser negativo.");
      return;
    }

    onConfirm({
      name: name.trim(),
      quantity: Number(quantity),
      unit,
      category,
      price: Number(price) || 0,
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <h3 style={{ color: "var(--text-primary)" }}>⭐ Detalles del producto</h3>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
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
          <label style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
            Total (Auto): ${totalAuto.toLocaleString()}
          </label>
          <UITextInput
            type="number"
            placeholder="Precio unitario"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            min={0}
            step={0.01}
          />
        </div>

        <div>
          <label style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Categoría</label>
          <UISelect value={category} onChange={(e) => setCategory(e.target.value)}>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.name}>{cat.icon} {cat.name}</option>
            ))}
          </UISelect>
        </div>

        <div>
          <label style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Medida</label>
          <UISelect value={unit} onChange={(e) => setUnit(e.target.value as ShoppingItemUnit)}>
            {UNITS.map((u) => (
              <option key={u.value} value={u.value}>{u.label}</option>
            ))}
          </UISelect>
        </div>
      </div>

      <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", textAlign: "center" }}>
        Precio real: ${totalAuto.toLocaleString()}
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "0.5rem" }}>
        <UIButton onClick={onCancel} variant="default">Cancelar</UIButton>
        <UIButton variant="primary" onClick={handleConfirm}>Aceptar</UIButton>
      </div>
    </div>
  );
};

export default ProductModal;
