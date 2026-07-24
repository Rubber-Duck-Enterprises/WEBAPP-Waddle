import localforage from "localforage";

/**
 * Real persistence keys used by Zustand stores (before scope suffix).
 * These MUST match the `name` field in each store's persist config.
 */
const STORE_KEYS = ["waddle-wallet", "waddle-list", "waddle-settings"] as const;

type StoreKey = (typeof STORE_KEYS)[number];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function safeParse(v: unknown): Record<string, unknown> | null {
  try {
    if (!v) return null;
    if (typeof v === "string") return JSON.parse(v);
    if (typeof v === "object") return v as Record<string, unknown>;
    return null;
  } catch {
    return null;
  }
}

function isNonEmptyArray(v: unknown): v is unknown[] {
  return Array.isArray(v) && v.length > 0;
}

/**
 * Deduplicate by `id` field, preferring the LAST occurrence (user data wins
 * over anon data when both arrays are spread user-first).
 */
function uniqById<T extends { id: string }>(arr: T[]): T[] {
  const map = new Map<string, T>();
  for (const item of arr) map.set(item.id, item);
  return Array.from(map.values());
}

/**
 * Deduplicate items that share the same `name` field (case-insensitive).
 * Keeps the FIRST occurrence (user data should come first so it takes priority).
 */
function uniqByName<T extends { id: string; name: string }>(arr: T[]): T[] {
  const seen = new Map<string, T>();
  for (const item of arr) {
    const key = item.name.trim().toLowerCase();
    if (!seen.has(key)) {
      seen.set(key, item);
    }
  }
  return Array.from(seen.values());
}

/**
 * Deduplicate expenses by content signature (description + amount + date + category).
 * This catches cases where the same expense was persisted with different IDs
 * (e.g., due to re-serialization or store write race conditions).
 * Keeps the FIRST occurrence (user data should come first).
 */
function uniqBySignature<T extends { id: string; description: string; amount: number; date: string; category: string }>(arr: T[]): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const item of arr) {
    const sig = `${item.description}|${item.amount}|${item.date}|${item.category}`;
    if (!seen.has(sig)) {
      seen.add(sig);
      result.push(item);
    }
  }
  return result;
}

/**
 * Deduplicate tasks by content signature (title + listId + createdAt).
 * Catches tasks that were re-persisted with new IDs during auth transitions.
 * Keeps the FIRST occurrence (user data priority).
 */
function uniqTasksBySignature<T extends { id: string; title: string; listId?: string; createdAt: string }>(arr: T[]): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const item of arr) {
    const sig = `${item.title}|${item.listId ?? "none"}|${item.createdAt}`;
    if (!seen.has(sig)) {
      seen.add(sig);
      result.push(item);
    }
  }
  return result;
}

// ─── Data detection ───────────────────────────────────────────────────────────

function hasMeaningfulData(storeKey: StoreKey, raw: unknown): boolean {
  const obj = safeParse(raw);
  if (!obj) return false;

  // Zustand persist wraps state in { state: {...}, version: N }
  const state = (obj.state as Record<string, unknown>) ?? obj;

  switch (storeKey) {
    case "waddle-wallet":
      return isNonEmptyArray(state.sections) || isNonEmptyArray(state.expenses);
    case "waddle-list":
      return isNonEmptyArray(state.taskLists) || isNonEmptyArray(state.tasks);
    case "waddle-settings":
      return state !== null && Object.keys(state).length > 0;
    default:
      return false;
  }
}

// ─── Merge logic per store ────────────────────────────────────────────────────

function mergePersisted(storeKey: StoreKey, anonRaw: unknown, userRaw: unknown): string | null {
  const anonObj = safeParse(anonRaw);
  if (!anonObj) return null;

  const userObj = safeParse(userRaw);

  // If user has no existing data, just use anon data as-is
  if (!userObj) return JSON.stringify(anonObj);

  // Extract state from Zustand persist wrapper
  const anonState = (anonObj.state as Record<string, unknown>) ?? anonObj;
  const userState = (userObj.state as Record<string, unknown>) ?? userObj;

  switch (storeKey) {
    case "waddle-wallet": {
      // Merge sections: dedup by id first, then by name (user wins)
      const anonSections = (anonState.sections as Array<{ id: string; name: string }>) || [];
      const userSections = (userState.sections as Array<{ id: string; name: string }>) || [];
      const mergedById = uniqById([...userSections, ...anonSections]);
      userState.sections = uniqByName(mergedById);

      // Merge expenses: dedup by id, then by content signature to catch
      // re-serialized duplicates that got new IDs somehow
      const anonExpenses = (anonState.expenses as Array<{ id: string; description: string; amount: number; date: string; category: string }>) || [];
      const userExpenses = (userState.expenses as Array<{ id: string; description: string; amount: number; date: string; category: string }>) || [];
      const mergedExpenses = uniqById([...userExpenses, ...anonExpenses]);
      userState.expenses = uniqBySignature(mergedExpenses);

      // Keep hasFirstWallet if either had it
      userState.hasFirstWallet = !!(userState.hasFirstWallet || anonState.hasFirstWallet);
      break;
    }

    case "waddle-list": {
      // Merge task lists: dedup by id, then by name (user wins)
      const anonLists = (anonState.taskLists as Array<{ id: string; name: string }>) || [];
      const userLists = (userState.taskLists as Array<{ id: string; name: string }>) || [];
      const mergedById = uniqById([...userLists, ...anonLists]);
      userState.taskLists = uniqByName(mergedById);

      // Merge tasks: dedup by id, then by content signature (title + listId + createdAt)
      const anonTasks = (anonState.tasks as Array<{ id: string; title: string; listId?: string; createdAt: string }>) || [];
      const userTasks = (userState.tasks as Array<{ id: string; title: string; listId?: string; createdAt: string }>) || [];
      const mergedTasks = uniqById([...userTasks, ...anonTasks]);
      userState.tasks = uniqTasksBySignature(mergedTasks);

      // Merge tags by list (user tags win on conflicts)
      const anonTags = (anonState.tagsByList as Record<string, unknown>) || {};
      const userTags = (userState.tagsByList as Record<string, unknown>) || {};
      userState.tagsByList = { ...anonTags, ...userTags };

      // Keep user's activeListId if set, otherwise fallback to anon's
      userState.activeListId = userState.activeListId ?? anonState.activeListId ?? "all";
      break;
    }

    case "waddle-settings": {
      // Settings: anon as base, user overrides (user preferences take priority)
      const merged = { ...anonState, ...userState, hydrated: false };

      if (userObj.state) {
        userObj.state = merged;
      } else {
        Object.assign(userObj, merged);
      }
      return JSON.stringify(userObj);
    }
  }

  // Write merged state back into wrapper
  if (userObj.state) {
    userObj.state = userState;
  } else {
    Object.assign(userObj, userState);
  }

  return JSON.stringify(userObj);
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns true if there is meaningful data stored under anon scope.
 */
export async function hasAnonData(): Promise<boolean> {
  try {
    for (const storeKey of STORE_KEYS) {
      const anonKey = `${storeKey}-anon`;
      try {
        const val = await localforage.getItem(anonKey);
        if (hasMeaningfulData(storeKey, val)) return true;
      } catch (err) {
        console.error(`❌ Failed to check anon data for ${storeKey}:`, err);
      }
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Removes all anonymous scoped data from localforage.
 */
export async function clearAnonData(): Promise<void> {
  const results = await Promise.allSettled(
    STORE_KEYS.map((key) => localforage.removeItem(`${key}-anon`))
  );

  results.forEach((result, i) => {
    if (result.status === "rejected") {
      console.error(`❌ Failed to clear anon data for ${STORE_KEYS[i]}:`, result.reason);
    }
  });
}

/**
 * Merges anonymous data into the authenticated user's scoped storage.
 *
 * Deduplication rules:
 *  - Sections and TaskLists: dedup by id AND by name (user data wins on name conflicts)
 *  - Expenses and Tasks: dedup by id only
 *  - Settings: user preferences override anon preferences
 *  - Tags: user tags override anon tags per list
 *
 * After successful merge, clears all anonymous data.
 * Throws if any store migration fails (prevents marking as handled).
 */
export async function migrateAnonToUserAllStores(uid: string): Promise<void> {
  const errors: Array<{ storeKey: StoreKey; error: unknown }> = [];

  for (const storeKey of STORE_KEYS) {
    try {
      const anonKey = `${storeKey}-anon`;
      const userKey = `${storeKey}-${uid}`;

      const anonVal = await localforage.getItem(anonKey);
      if (!hasMeaningfulData(storeKey, anonVal)) continue;

      const userVal = await localforage.getItem(userKey);
      const merged = mergePersisted(storeKey, anonVal, userVal);

      if (merged) {
        await localforage.setItem(userKey, merged);
      }
    } catch (err) {
      console.error(`❌ Failed to migrate ${storeKey}:`, err);
      errors.push({ storeKey, error: err });
    }
  }

  // Always attempt to clear anon data even if some merges failed
  await clearAnonData();

  if (errors.length > 0) {
    throw new Error(
      `Migración falló para: ${errors.map((e) => e.storeKey).join(", ")}`
    );
  }
}
