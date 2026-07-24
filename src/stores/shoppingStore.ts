import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { nanoid } from "nanoid";
import localforage from "localforage";
import { createScopedStorage } from "@/lib/scopedStorage";
import type {
  ShoppingTrip,
  ShoppingList,
  ShoppingListItem,
  ShoppingItem,
  ShoppingStore as ShoppingStoreType,
  ShoppingCategory,
  ShoppingTripStatus,
} from "@/types/shopping";

interface ShoppingState {
  // Listas reutilizables de productos
  lists: ShoppingList[];
  // Compras (trips)
  trips: ShoppingTrip[];
  // Tiendas favoritas
  stores: ShoppingStoreType[];
  // Categorías de productos
  categories: ShoppingCategory[];
  // Presupuesto global mensual
  monthlyBudget: number;

  // --- Listas ---
  addList: (name: string) => string;
  updateList: (id: string, updated: Partial<Omit<ShoppingList, "id">>) => void;
  deleteList: (id: string) => void;
  addItemToList: (listId: string, item: Omit<ShoppingListItem, "id">) => void;
  updateListItem: (listId: string, itemId: string, updated: Partial<Omit<ShoppingListItem, "id">>) => void;
  removeItemFromList: (listId: string, itemId: string) => void;

  // --- Tiendas ---
  addStore: (name: string, icon: string) => void;
  updateStore: (id: string, updated: Partial<Omit<ShoppingStoreType, "id">>) => void;
  removeStore: (id: string) => void;

  // --- Categorías ---
  addCategory: (name: string, icon: string) => void;
  updateCategory: (id: string, updated: Partial<Omit<ShoppingCategory, "id">>) => void;
  removeCategory: (id: string) => void;

  // --- Presupuesto ---
  setMonthlyBudget: (amount: number) => void;

  // --- Trips (Compras) ---
  createTrip: (data: {
    listId: string;
    listName: string;
    store: string;
    budget: number;
    items: Omit<ShoppingItem, "id" | "inCart" | "removed">[];
  }) => string;
  updateTripStatus: (tripId: string, status: ShoppingTripStatus) => void;
  startTrip: (tripId: string) => void;
  completeTrip: (tripId: string) => void;
  deleteTrip: (tripId: string) => void;

  // --- Items dentro de un trip ---
  markItemInCart: (tripId: string, itemId: string, actualPrice: number) => void;
  unmarkItemFromCart: (tripId: string, itemId: string) => void;
  removeItemFromTrip: (tripId: string, itemId: string) => void;
  addItemToTrip: (tripId: string, item: Omit<ShoppingItem, "id" | "inCart" | "removed">) => void;
  updateTripItem: (tripId: string, itemId: string, updated: Partial<Omit<ShoppingItem, "id">>) => void;
}

export const useShoppingStore = create<ShoppingState>()(
  persist(
    (set, get) => ({
      lists: [],
      trips: [],
      stores: [
        { id: "store-walmart", name: "Walmart", icon: "🏬" },
        { id: "store-heb", name: "HEB", icon: "🛒" },
        { id: "store-soriana", name: "Soriana", icon: "🏪" },
      ],
      categories: [
        { id: "cat-lacteos", name: "Lácteos", icon: "🥛" },
        { id: "cat-carnes", name: "Carnes", icon: "🥩" },
        { id: "cat-frutas", name: "Frutas y verduras", icon: "🥬" },
        { id: "cat-panaderia", name: "Panadería", icon: "🍞" },
        { id: "cat-bebidas", name: "Bebidas", icon: "🥤" },
        { id: "cat-limpieza", name: "Limpieza", icon: "🧹" },
        { id: "cat-higiene", name: "Higiene", icon: "🧴" },
        { id: "cat-abarrotes", name: "Abarrotes", icon: "🛒" },
        { id: "cat-congelados", name: "Congelados", icon: "🧊" },
        { id: "cat-snacks", name: "Snacks", icon: "🍿" },
        { id: "cat-ropa", name: "Ropa", icon: "👕" },
        { id: "cat-electronica", name: "Electrónica", icon: "📱" },
        { id: "cat-hogar", name: "Hogar", icon: "🏠" },
        { id: "cat-mascotas", name: "Mascotas", icon: "🐶" },
        { id: "cat-farmacia", name: "Farmacia", icon: "💊" },
        { id: "cat-otro", name: "Otro", icon: "📦" },
      ],
      monthlyBudget: 0,

      // --- Listas ---
      addList: (name) => {
        const id = nanoid();
        const newList: ShoppingList = { id, name, items: [] };
        set({ lists: [...get().lists, newList] });
        return id;
      },
      updateList: (id, updated) => {
        set({
          lists: get().lists.map((l) => (l.id === id ? { ...l, ...updated } : l)),
        });
      },
      deleteList: (id) => {
        set({ lists: get().lists.filter((l) => l.id !== id) });
      },
      addItemToList: (listId, item) => {
        const newItem: ShoppingListItem = { id: nanoid(), ...item };
        set({
          lists: get().lists.map((l) =>
            l.id === listId ? { ...l, items: [...l.items, newItem] } : l
          ),
        });
      },
      updateListItem: (listId, itemId, updated) => {
        set({
          lists: get().lists.map((l) =>
            l.id === listId
              ? {
                  ...l,
                  items: l.items.map((i) =>
                    i.id === itemId ? { ...i, ...updated } : i
                  ),
                }
              : l
          ),
        });
      },
      removeItemFromList: (listId, itemId) => {
        set({
          lists: get().lists.map((l) =>
            l.id === listId
              ? { ...l, items: l.items.filter((i) => i.id !== itemId) }
              : l
          ),
        });
      },

      // --- Tiendas ---
      addStore: (name, icon) => {
        const newStore: ShoppingStoreType = { id: nanoid(), name, icon };
        set({ stores: [...get().stores, newStore] });
      },
      updateStore: (id, updated) => {
        set({
          stores: get().stores.map((s) => (s.id === id ? { ...s, ...updated } : s)),
        });
      },
      removeStore: (id) => {
        set({ stores: get().stores.filter((s) => s.id !== id) });
      },

      // --- Categorías ---
      addCategory: (name, icon) => {
        const newCategory: ShoppingCategory = { id: nanoid(), name, icon };
        set({ categories: [...get().categories, newCategory] });
      },
      updateCategory: (id, updated) => {
        set({
          categories: get().categories.map((c) => (c.id === id ? { ...c, ...updated } : c)),
        });
      },
      removeCategory: (id) => {
        set({ categories: get().categories.filter((c) => c.id !== id) });
      },

      // --- Presupuesto ---
      setMonthlyBudget: (amount) => {
        set({ monthlyBudget: amount });
      },

      // --- Trips ---
      createTrip: (data) => {
        const id = nanoid();
        const items: ShoppingItem[] = data.items.map((item) => ({
          ...item,
          id: nanoid(),
          inCart: false,
          removed: false,
        }));
        const estimatedTotal = items.reduce(
          (acc, i) => acc + i.estimatedPrice * i.quantity,
          0
        );
        const newTrip: ShoppingTrip = {
          id,
          listId: data.listId,
          listName: data.listName,
          store: data.store,
          budget: data.budget,
          estimatedTotal,
          actualTotal: 0,
          status: "planning",
          createdAt: new Date().toISOString(),
          items,
        };
        set({ trips: [...get().trips, newTrip] });
        return id;
      },
      updateTripStatus: (tripId, status) => {
        set({
          trips: get().trips.map((t) =>
            t.id === tripId ? { ...t, status } : t
          ),
        });
      },
      startTrip: (tripId) => {
        set({
          trips: get().trips.map((t) =>
            t.id === tripId ? { ...t, status: "in_progress" as const, startedAt: t.startedAt || new Date().toISOString() } : t
          ),
        });
      },
      completeTrip: (tripId) => {
        set({
          trips: get().trips.map((t) => {
            if (t.id !== tripId) return t;
            const actualTotal = t.items
              .filter((i) => i.inCart && !i.removed)
              .reduce((acc, i) => acc + (i.actualPrice ?? i.estimatedPrice) * i.quantity, 0);
            const now = new Date();
            const startedAt = t.startedAt ? new Date(t.startedAt) : now;
            const durationMinutes = Math.round((now.getTime() - startedAt.getTime()) / 60000);
            return {
              ...t,
              status: "completed" as const,
              completedAt: now.toISOString(),
              actualTotal,
              durationMinutes,
            };
          }),
        });
      },
      deleteTrip: (tripId) => {
        set({ trips: get().trips.filter((t) => t.id !== tripId) });
      },

      // --- Items dentro de un trip ---
      markItemInCart: (tripId, itemId, actualPrice) => {
        set({
          trips: get().trips.map((t) =>
            t.id === tripId
              ? {
                  ...t,
                  items: t.items.map((i) =>
                    i.id === itemId ? { ...i, inCart: true, actualPrice } : i
                  ),
                }
              : t
          ),
        });
      },
      unmarkItemFromCart: (tripId, itemId) => {
        set({
          trips: get().trips.map((t) =>
            t.id === tripId
              ? {
                  ...t,
                  items: t.items.map((i) =>
                    i.id === itemId ? { ...i, inCart: false, actualPrice: undefined } : i
                  ),
                }
              : t
          ),
        });
      },
      removeItemFromTrip: (tripId, itemId) => {
        set({
          trips: get().trips.map((t) =>
            t.id === tripId
              ? {
                  ...t,
                  items: t.items.map((i) =>
                    i.id === itemId ? { ...i, removed: true } : i
                  ),
                }
              : t
          ),
        });
      },
      addItemToTrip: (tripId, item) => {
        const newItem: ShoppingItem = {
          ...item,
          id: nanoid(),
          inCart: false,
          removed: false,
          addedDuringTrip: true,
        };
        set({
          trips: get().trips.map((t) =>
            t.id === tripId ? { ...t, items: [...t.items, newItem] } : t
          ),
        });
      },
      updateTripItem: (tripId, itemId, updated) => {
        set({
          trips: get().trips.map((t) =>
            t.id === tripId
              ? {
                  ...t,
                  items: t.items.map((i) =>
                    i.id === itemId ? { ...i, ...updated } : i
                  ),
                }
              : t
          ),
        });
      },
    }),
    {
      name: "waddle-shopping",
      storage: createJSONStorage(() => createScopedStorage(localforage)),
      partialize: (state) => ({
        lists: state.lists,
        trips: state.trips,
        stores: state.stores,
        categories: state.categories,
        monthlyBudget: state.monthlyBudget,
      }),
    }
  )
);
