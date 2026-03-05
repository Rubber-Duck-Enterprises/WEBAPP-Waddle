import localforage from "localforage";

const keyFor = (uid: string) => `waddle-migration-done-${uid}`;

export async function wasMigrationHandled(uid: string): Promise<boolean> {
  try {
    const v = await localforage.getItem(keyFor(uid));
    return v === true;
  } catch (err) {
    console.error("❌ Failed to check migration flag:", err);
    return false; // Fail gracefully - assume not handled to be safe
  }
}

export async function markMigrationHandled(uid: string): Promise<void> {
  try {
    await localforage.setItem(keyFor(uid), true);
  } catch (err) {
    console.error("❌ Failed to mark migration as handled:", err);
    throw err; // Re-throw to allow caller to handle
  }
}