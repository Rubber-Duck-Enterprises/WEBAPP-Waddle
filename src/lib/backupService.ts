import { doc, getDoc, setDoc } from "firebase/firestore";
import localforage from "localforage";
import { auth, db } from "@/lib/firebase";
import { useWalletStore } from "@/stores/walletStore";
import { useListStore } from "@/stores/listStore";
import { useSessionStore } from "@/stores/sessionStore";
import type { BackupSnapshot } from "./backupTypes";
import { serializeBackup, validateSnapshot, deserializeBackup } from "./backupSerializer";
import { migrateSnapshot } from "./backupMigrations";
import { rehydrateAllStores } from "./resetUserStores";

const MAX_HISTORY_SLOTS = 3;

// ─── Cloud Backup ─────────────────────────────────────────────────────────────

/**
 * Serializes the current wallet and list state and saves it to Firestore
 * under `backups/{uid}` in the `manual` field (Free Tier slot).
 *
 * On success, updates `lastCloudBackupAt` in sessionStore.
 * On Firestore error, throws a user-friendly message.
 *
 * Requirements: 2.1, 2.2, 2.4, 2.5
 */
export async function saveCloudBackup(): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Debes iniciar sesión para guardar un respaldo en la nube.");
  }

  const walletState = useWalletStore.getState();
  const listState = useListStore.getState();
  const { isPro } = useSessionStore.getState();

  const snapshot = serializeBackup(walletState, listState, "manual", "full");

  try {
    const ref = doc(db, "backups", user.uid);

    const updatePayload: Record<string, unknown> = {
      manual: snapshot,
      updatedAt: new Date().toISOString(),
      email: user.email,
    };

    if (isPro) {
      // Read current manual_history to prepend the new snapshot
      const existing = await getDoc(ref);
      const currentHistory: BackupSnapshot[] = existing.exists()
        ? (existing.data()?.manual_history ?? [])
        : [];

      updatePayload.manual_history = [snapshot, ...currentHistory].slice(
        0,
        MAX_HISTORY_SLOTS
      );
    }

    await setDoc(ref, updatePayload, { merge: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error desconocido";
    throw new Error(
      `No se pudo guardar el respaldo en la nube. ${message}`
    );
  }

  useSessionStore.getState().setLastCloudBackupAt(snapshot.createdAt);
}

/**
 * Returns true if a new automatic backup should be triggered.
 *
 * Rules:
 *  - If `lastAutoBackupAt` is null (never backed up), returns true.
 *  - If the last auto backup was more than 24 hours ago, returns true.
 *  - Otherwise returns false.
 *
 * Requirements: 7.3
 */
export function shouldTriggerAutoBackup(lastAutoBackupAt: string | null): boolean {
  if (lastAutoBackupAt === null) {
    return true;
  }
  const last = new Date(lastAutoBackupAt).getTime();
  const now = Date.now();
  const twentyFourHours = 24 * 60 * 60 * 1000;
  return now - last > twentyFourHours;
}

/**
 * Saves an automatic backup to `auto_history` (max 3 slots) in Firestore,
 * but only if `shouldTriggerAutoBackup` returns true.
 *
 * Requires the user to be authenticated and to have Pro tier active.
 *
 * Requirements: 7.2, 7.3, 7.4
 */
export async function saveAutoBackup(): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;

  const { isPro } = useSessionStore.getState();
  if (!isPro) return;

  const ref = doc(db, "backups", user.uid);

  // Read current auto_history and last auto backup timestamp
  let currentAutoHistory: BackupSnapshot[] = [];
  let lastAutoBackupAt: string | null = null;

  try {
    const existing = await getDoc(ref);
    if (existing.exists()) {
      const data = existing.data();
      currentAutoHistory = data?.auto_history ?? [];
      lastAutoBackupAt = currentAutoHistory[0]?.createdAt ?? null;
    }
  } catch {
    // If we can't read, skip the auto backup silently
    return;
  }

  if (!shouldTriggerAutoBackup(lastAutoBackupAt)) {
    return;
  }

  const walletState = useWalletStore.getState();
  const listState = useListStore.getState();
  const snapshot = serializeBackup(walletState, listState, "automatic", "full");

  try {
    await setDoc(
      ref,
      {
        auto_history: [snapshot, ...currentAutoHistory].slice(0, MAX_HISTORY_SLOTS),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch {
    // Auto backup failures are silent — don't disrupt the user
  }
}

// ─── Load Cloud Backup ────────────────────────────────────────────────────────

/**
 * Reads the Firestore document `backups/{uid}` and returns the `manual` snapshot.
 *
 * Returns `null` if:
 *  - the document doesn't exist
 *  - the `manual` field is absent or null
 *
 * On network error, throws a user-friendly Spanish message.
 *
 * Requirements: 3.1, 3.4, 3.5
 */
export async function loadCloudBackup(): Promise<BackupSnapshot | null> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Debes iniciar sesión para cargar un respaldo desde la nube.");
  }

  let docSnap;
  try {
    docSnap = await getDoc(doc(db, "backups", user.uid));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    throw new Error(
      `No se pudo conectar con la nube para cargar el respaldo. ${message}`
    );
  }

  if (!docSnap.exists()) {
    return null;
  }

  const manual = docSnap.data()?.manual;
  if (!manual) {
    return null;
  }

  return manual as BackupSnapshot;
}

// ─── Load Cloud Backup History (Pro) ─────────────────────────────────────────

/**
 * Reads the `manual_history` array from the Firestore document `backups/{uid}`.
 * Returns an empty array if the document doesn't exist or the field is absent.
 *
 * Requirements: 6.5, 7.5
 */
export async function loadCloudBackupHistory(): Promise<BackupSnapshot[]> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Debes iniciar sesión para cargar el historial de respaldos.");
  }

  let docSnap;
  try {
    docSnap = await getDoc(doc(db, "backups", user.uid));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    throw new Error(
      `No se pudo conectar con la nube para cargar el historial. ${message}`
    );
  }

  if (!docSnap.exists()) {
    return [];
  }

  return (docSnap.data()?.manual_history ?? []) as BackupSnapshot[];
}

// ─── Restore ─────────────────────────────────────────────────────────────────

/**
 * Restores the user's data from a BackupSnapshot.
 *
 * Steps:
 *  1. Apply schema migrations to the snapshot.
 *  2. Deserialize to get scoped localforage keys and values.
 *  3. Write wallet and list data to localforage.
 *  4. Rehydrate all stores so the UI reflects the restored data.
 *
 * Throws if the user is not authenticated.
 *
 * Requirements: 3.3, 5.3
 */
export async function restoreFromSnapshot(snapshot: BackupSnapshot): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Debes iniciar sesión para restaurar un respaldo.");
  }

  const migratedSnapshot = migrateSnapshot(snapshot);
  const { walletKey, walletValue, listKey, listValue } = deserializeBackup(migratedSnapshot, user.uid);

  await localforage.setItem(walletKey, walletValue);
  await localforage.setItem(listKey, listValue);

  await rehydrateAllStores();
}

// ─── Filename Helper ──────────────────────────────────────────────────────────

/**
 * Generates a backup filename using the local date (not UTC).
 * Format: `waddle-backup-{YYYY-MM-DD}.json`
 */
export function getBackupFilename(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `waddle-backup-${year}-${month}-${day}.json`;
}

// ─── Export ───────────────────────────────────────────────────────────────────

/**
 * Triggers a browser file download for the given snapshot.
 * The caller is responsible for generating the filename (e.g. via getBackupFilename).
 *
 * Requirements: 4.1, 4.2, 4.5
 */
export function exportBackupToFile(
  snapshot: BackupSnapshot,
  filename: string
): void {
  const json = JSON.stringify(snapshot, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();

  URL.revokeObjectURL(url);
}

// ─── Import ───────────────────────────────────────────────────────────────────

/**
 * Reads a JSON file, validates it as a BackupSnapshot, applies any needed
 * migrations, and returns the resulting snapshot.
 *
 * Throws a descriptive error if:
 *  - the file content is not valid JSON
 *  - the parsed object fails validateSnapshot
 *
 * Requirements: 5.1, 5.4, 5.5, 5.6
 */
export async function importBackupFromFile(
  file: File
): Promise<BackupSnapshot> {
  let text: string;
  try {
    text = await file.text();
  } catch {
    throw new Error("No se pudo leer el archivo.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(
      "El archivo no contiene JSON válido. Verifica que el archivo no esté corrupto."
    );
  }

  if (!validateSnapshot(parsed)) {
    throw new Error(
      "El archivo no es un respaldo válido. Faltan campos requeridos (version, createdAt, data)."
    );
  }

  return migrateSnapshot(parsed);
}
