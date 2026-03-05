import { useExpenseStore } from "@/stores/expenseStore";
import { useSectionStore } from "@/stores/sectionStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useTaskListStore } from "@/stores/taskListStore";
import { useTaskStore } from "@/stores/taskStore";

export function resetUserStoresToEmpty() {
  useExpenseStore.setState(useExpenseStore.getInitialState(), true);
  useSectionStore.setState(useSectionStore.getInitialState(), true);
  useTaskListStore.setState(useTaskListStore.getInitialState(), true);
  useTaskStore.setState(useTaskStore.getInitialState(), true);
  useSettingsStore.setState(useSettingsStore.getInitialState(), true);
  useSettingsStore.setState({ hydrated: false }, false);
}

export async function rehydrateAllStores() {
  await Promise.all([
    useExpenseStore.persist.rehydrate(),
    useSectionStore.persist.rehydrate(),
    useSettingsStore.persist.rehydrate(),
    useTaskListStore.persist.rehydrate(),
    useTaskStore.persist.rehydrate(),
  ]);
}