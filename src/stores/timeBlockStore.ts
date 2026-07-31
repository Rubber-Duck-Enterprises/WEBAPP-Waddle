import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { nanoid } from "nanoid";
import localforage from "localforage";
import { TimeBlock } from "@/types";
import { createScopedStorage } from "@/lib/scopedStorage";

export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + (m || 0);
}

export function getCurrentDayMinutes(date: Date = new Date()): number {
  return date.getHours() * 60 + date.getMinutes();
}

interface TimeBlockStore {
  blocks: TimeBlock[];
  selectedBlockId: string | null;
  
  addBlock: (block: Omit<TimeBlock, "id">) => void;
  updateBlock: (id: string, updated: Partial<TimeBlock>) => void;
  deleteBlock: (id: string) => void;
  setSelectedBlockId: (id: string | null) => void;
  
  getActiveBlock: (date?: Date) => TimeBlock | null;
  getBlocksForDay: (dayOfWeek: number) => TimeBlock[];
}

export const useTimeBlockStore = create<TimeBlockStore>()(
  persist(
    (set, get) => ({
      blocks: [], // Inicia vacío por defecto hasta que el usuario agregue sus bloques
      selectedBlockId: null,

      addBlock: (blockData) => {
        const newBlock: TimeBlock = {
          id: nanoid(),
          ...blockData,
        };
        set((state) => ({ blocks: [...state.blocks, newBlock] }));
      },

      updateBlock: (id, updated) => {
        set((state) => ({
          blocks: state.blocks.map((b) => (b.id === id ? { ...b, ...updated } : b)),
        }));
      },

      deleteBlock: (id) => {
        set((state) => ({
          blocks: state.blocks.filter((b) => b.id !== id),
          selectedBlockId: state.selectedBlockId === id ? null : state.selectedBlockId,
        }));
      },

      setSelectedBlockId: (id) => set({ selectedBlockId: id }),

      getActiveBlock: (date = new Date()) => {
        const dayOfWeek = date.getDay(); // 0 = Sun, 1 = Mon ...
        const currentMins = getCurrentDayMinutes(date);

        const active = get().blocks.find((b) => {
          if (!b.daysOfWeek.includes(dayOfWeek)) return false;
          const startMins = timeToMinutes(b.startTime);
          const endMins = timeToMinutes(b.endTime);
          return currentMins >= startMins && currentMins < endMins;
        });

        return active || null;
      },

      getBlocksForDay: (dayOfWeek) => {
        return get()
          .blocks.filter((b) => b.daysOfWeek.includes(dayOfWeek))
          .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
      },
    }),
    {
      name: "waddle-time-blocks",
      storage: createJSONStorage(() => createScopedStorage(localforage)),
      partialize: (state) => ({
        blocks: state.blocks,
        selectedBlockId: state.selectedBlockId,
      }),
    }
  )
);
