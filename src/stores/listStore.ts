import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { nanoid } from "nanoid";
import localforage from "localforage";
import { 
  TaskList, 
  Task,
  Tag 
} from "@/types";
import { createScopedStorage } from "@/lib/scopedStorage";

type ListId = string | "all";
type TaskFilter = "all" | "done" | "pending";
 
interface TaskListStore {
  taskLists: TaskList[];
  tagsByList: Record<string, Tag[]>;
  activeListId: ListId;
  activeFilter: TaskFilter;

  addTaskList: (list: Omit<TaskList, "id">) => void;
  updateTaskList: (id: string, updated: Partial<TaskList>) => void;
  deleteTaskList: (id: string) => void;
  setActiveListId: (id: ListId) => void;
  setActiveFilter: (filter: TaskFilter) => void;
  addTagToList: (listId: string, tag: Tag) => void;
  getTagsForList: (listId: string) => Tag[];

  tasks: Task[];

  addTask: (task: Omit<Task, "id" | "createdAt" | "isDone">) => void;
  updateTask: (id: string, updated: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTaskDone: (id: string) => void;
  addSubtask: (taskId: string, title: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  deleteSubtask: (taskId: string, subtaskId: string) => void;
}

function getNextDueDate(current: string, repeat: Task["repeat"]): string {
  const date = new Date(current);
  if (repeat === "daily") date.setDate(date.getDate() + 1);
  if (repeat === "weekly") date.setDate(date.getDate() + 7);
  if (repeat === "monthly") date.setMonth(date.getMonth() + 1);
  // Guardar como fecha local (sin conversión UTC) para evitar desfase de timezone
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}T12:00:00`;
}

export const useListStore = create<TaskListStore>()(
  persist(
    (set, get) => ({
      taskLists: [],
      tagsByList: {},
      activeListId: "all",
      activeFilter: "pending",

      addTaskList: (list) => {
        const newList: TaskList = { id: nanoid(), ...list };
        set({ taskLists: [...get().taskLists, newList] });
      },
      updateTaskList: (id, updated) => {
        set({
          taskLists: get().taskLists.map((l) =>
            l.id === id ? { ...l, ...updated } : l
          ),
        });
      },
      deleteTaskList: (id) => {
        const tagsByList = { ...get().tagsByList };
        delete tagsByList[id];

        const remaining = get().taskLists.filter((l) => l.id !== id);
        const remainingTasks = get().tasks.filter((t) => t.listId !== id);

        set((state) => ({
          taskLists: remaining,
          tasks: remainingTasks,
          tagsByList,
          activeListId: state.activeListId === id ? "all" : state.activeListId,
        }));
      },
      setActiveListId: (id) => set({ activeListId: id }),
      setActiveFilter: (filter) => set({ activeFilter: filter }),
      addTagToList: (listId, tag) => {
        const existing = get().tagsByList[listId] || [];
        const alreadyExists = existing.some((t) => t.name === tag.name);
        if (alreadyExists) return;

        set((state) => ({
          tagsByList: {
            ...state.tagsByList,
            [listId]: [...existing, tag],
          },
        }));
      },
      getTagsForList: (listId) => get().tagsByList[listId] || [],

      tasks: [],
      
      addTask: (task) => {
        const newTask: Task = {
          id: nanoid(),
          createdAt: new Date().toISOString(),
          ...task,
          isDone: false,
        };
        set({ tasks: [...get().tasks, newTask] });
      },
      updateTask: (id, updated) => {
        set({
          tasks: get().tasks.map((t) => (t.id === id ? { ...t, ...updated } : t)),
        });
      },
      deleteTask: (id) => {
        set({ tasks: get().tasks.filter((t) => t.id !== id) });
      },
      toggleTaskDone: (id) => {
        const currentTasks = get().tasks;
        const task = currentTasks.find((t) => t.id === id);
        if (!task) return;

        const nowIsDone = !task.isDone;
        const updated = {
          ...task,
          isDone: nowIsDone,
          completedAt: nowIsDone ? new Date().toISOString() : undefined,
        };
        const updatedTasks = currentTasks.map((t) =>
          t.id === id ? updated : t
        );

        // Si se marca como completada y es recurrente, crear la siguiente ocurrencia
        if (nowIsDone && task.repeat) {
          const newTask: Task = {
            ...task,
            id: nanoid(),
            createdAt: new Date().toISOString(),
            dueDate: getNextDueDate(task.dueDate || new Date().toISOString(), task.repeat),
            isDone: false,
            completedAt: undefined,
            // Resetear subtareas a pendientes para la nueva ocurrencia
            subtasks: task.subtasks?.map((s) => ({
              ...s,
              id: nanoid(),
              isDone: false,
            })),
          };
          updatedTasks.push(newTask);
        }

        set({ tasks: updatedTasks });
      },
      addSubtask: (taskId, title) => {
        const subtask: Task = {
          id: nanoid(),
          title,
          isDone: false,
          createdAt: new Date().toISOString(),
        };
        set({
          tasks: get().tasks.map((t) =>
            t.id === taskId
              ? { ...t, subtasks: [...(t.subtasks || []), subtask] }
              : t
          ),
        });
      },
      toggleSubtask: (taskId, subtaskId) => {
        set({
          tasks: get().tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  subtasks: (t.subtasks || []).map((s) =>
                    s.id === subtaskId ? { ...s, isDone: !s.isDone } : s
                  ),
                }
              : t
          ),
        });
      },
      deleteSubtask: (taskId, subtaskId) => {
        set({
          tasks: get().tasks.map((t) =>
            t.id === taskId
              ? { ...t, subtasks: (t.subtasks || []).filter((s) => s.id !== subtaskId) }
              : t
          ),
        });
      },
    }),
    {
      name: "waddle-list",
      storage: createJSONStorage(() => createScopedStorage(localforage)),
      partialize: (state) => ({
        taskLists: state.taskLists,
        tasks: state.tasks,
        tagsByList: state.tagsByList,
        activeListId: state.activeListId,
        activeFilter: state.activeFilter,
      }),
    }
  )
);