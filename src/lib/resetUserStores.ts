import { useWalletStore } from "@/stores/walletStore";
import { useListStore } from "@/stores/listStore";
import { useSettingsStore } from "@/stores/settingsStore";

export function resetUserStoresToEmpty() {
  useWalletStore.setState(useWalletStore.getInitialState(), true);
  useListStore.setState(useListStore.getInitialState(), true);
  useSettingsStore.setState(useSettingsStore.getInitialState(), true);
  useSettingsStore.setState({ hydrated: false }, false);
}

export async function rehydrateAllStores() {
  await Promise.all([
    useWalletStore.persist.rehydrate(),
    useListStore.persist.rehydrate(),
    useSettingsStore.persist.rehydrate(),
  ]);
}