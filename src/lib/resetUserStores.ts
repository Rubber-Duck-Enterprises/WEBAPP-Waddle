import { useWalletStore } from "@/stores/walletStore";
import { useListStore } from "@/stores/listStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useShoppingStore } from "@/stores/shoppingStore";
import { useTimeBlockStore } from "@/stores/timeBlockStore";
import { pausePersistence, resumePersistence } from "@/lib/scopedStorage";

export function pauseAllStores() {
  pausePersistence();
}

export function resumeAllStores() {
  resumePersistence();
}

export function resetUserStoresToEmpty() {
  useWalletStore.setState(useWalletStore.getInitialState(), true);
  useListStore.setState(useListStore.getInitialState(), true);
  useShoppingStore.setState(useShoppingStore.getInitialState(), true);
  useTimeBlockStore.setState(useTimeBlockStore.getInitialState(), true);
  useSettingsStore.setState(useSettingsStore.getInitialState(), true);
  useSettingsStore.setState({ hydrated: false }, false);
}

export async function rehydrateAllStores() {
  await Promise.all([
    useWalletStore.persist.rehydrate(),
    useListStore.persist.rehydrate(),
    useShoppingStore.persist.rehydrate(),
    useTimeBlockStore.persist.rehydrate(),
    useSettingsStore.persist.rehydrate(),
  ]);
}
