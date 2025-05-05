import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import localforage from "localforage";
import { Section } from "../types";
import { nanoid } from "nanoid";

interface SectionStore {
  sections: Section[];
  addSection: (section: Omit<Section, "id" | "createdAt">) => void;
  updateSection: (id: string, updated: Partial<Omit<Section, "id" | "createdAt">>) => void;
  deleteSection: (id: string) => void;
}

export const useSectionStore = create<SectionStore>()(
  persist(
    (set, get) => ({
      sections: [],
      addSection: (section) => {
        const newSection: Section = {
          id: nanoid(),
          createdAt: new Date().toISOString(),
          ...section,
        };
        set({ sections: [...get().sections, newSection] });
      },
      updateSection: (id, updated) => {
        set({
          sections: get().sections.map((s) =>
            s.id === id ? { ...s, ...updated } : s
          ),
        });
      },
      deleteSection: (id) => {
        set({ sections: get().sections.filter((s) => s.id !== id) });
      },
    }),
    {
      name: "waddle-sections",
      storage: createJSONStorage(() => localforage),
    }
  )
);
