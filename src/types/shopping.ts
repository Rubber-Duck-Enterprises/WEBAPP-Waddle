// Waddle Shopping — Tipos del módulo de compras

export type ShoppingTripStatus = "planning" | "in_progress" | "completed" | "cancelled";

export type ShoppingItemUnit = "unidad" | "kg" | "L" | "g" | "ml" | "paquete";

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  unit: ShoppingItemUnit;
  category: string;
  estimatedPrice: number;
  actualPrice?: number;
  inCart: boolean;
  removed: boolean;
  /** true si fue agregado durante la ejecución (con "¿Algo más?") */
  addedDuringTrip?: boolean;
}

export interface ShoppingTrip {
  id: string;
  listId: string;
  listName: string;
  store: string;
  budget: number;
  estimatedTotal: number;
  actualTotal: number;
  status: ShoppingTripStatus;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  durationMinutes?: number;
  items: ShoppingItem[];
}

export interface ShoppingListItem {
  id: string;
  name: string;
  category: string;
  unit: ShoppingItemUnit;
  lastPrice: number;
  averagePrice?: number;
}

export interface ShoppingList {
  id: string;
  name: string;
  items: ShoppingListItem[];
}

export interface ShoppingStore {
  id: string;
  name: string;
  icon: string;
}

export interface ShoppingCategory {
  id: string;
  name: string;
  icon: string;
}
