import localforage from "localforage";

const BASES = [
  "waddle-expenses",
  "waddle-sections",
  "waddle-settings",
  "waddle-list",
  "waddle-tasks",
] as const;

type Base = (typeof BASES)[number];

function safeParse(v: unknown) {
  try {
    if (!v) return null;
    return typeof v === "string" ? JSON.parse(v) : v;
  } catch {
    return null;
  }
}

function isNonEmptyArray(v: unknown) {
  return Array.isArray(v) && v.length > 0;
}

function hasMeaningfulData(base: Base, raw: unknown) {
  const obj = safeParse(raw);
  if (!obj) return false;

  const state = obj?.state ?? obj;

  if (base === "waddle-expenses") return isNonEmptyArray(state?.expenses);
  if (base === "waddle-sections") return isNonEmptyArray(state?.sections);
  if (base === "waddle-tasks") return isNonEmptyArray(state?.tasks);
  if (base === "waddle-list") return isNonEmptyArray(state?.taskLists) || !!state?.tagsByList;
  if (base === "waddle-settings") return !!state;
  return false;
}

function uniqById<T extends { id: string }>(arr: T[]) {
  const map = new Map<string, T>();
  for (const item of arr) map.set(item.id, item);
  return Array.from(map.values());
}

function mergePersisted(base: Base, anonRaw: unknown, userRaw: unknown) {
  const anonObj = safeParse(anonRaw);
  const userObj = safeParse(userRaw);

  if (!anonObj) return userRaw ?? null;

  if (!userObj) return JSON.stringify(anonObj);

  const anonState = anonObj.state ?? anonObj;
  let userState = userObj.state ?? userObj;

  if (base === "waddle-expenses") {
    const merged = uniqById([...(anonState.expenses || []), ...(userState.expenses || [])]);
    userState.expenses = merged;
  }

  if (base === "waddle-sections") {
    const merged = uniqById([...(anonState.sections || []), ...(userState.sections || [])]);
    userState.sections = merged;

    userState.hasFirstWallet = !!(userState.hasFirstWallet || anonState.hasFirstWallet);
  }

  if (base === "waddle-tasks") {
    const merged = uniqById([...(anonState.tasks || []), ...(userState.tasks || [])]);
    userState.tasks = merged;
  }

  if (base === "waddle-list") {
    const mergedLists = uniqById([...(anonState.taskLists || []), ...(userState.taskLists || [])]);
    userState.taskLists = mergedLists;

    userState.tagsByList = { ...(anonState.tagsByList || {}), ...(userState.tagsByList || {}) };

    userState.activeListId = userState.activeListId ?? anonState.activeListId ?? "all";
  }

  if (base === "waddle-settings") {
    userState = { ...(anonState || {}), ...(userState || {}) };
    userState.hydrated = false;

    if (userObj.state) userObj.state = userState;
    else Object.assign(userObj, userState);

    return JSON.stringify(userObj);
  }

  if (userObj.state) {
    userObj.state = userState;
    return JSON.stringify(userObj);
  }

  return JSON.stringify(userState);
}

export async function hasAnonData(): Promise<boolean> {
  try {
    for (const base of BASES) {
      const anonKey = `${base}-anon`;
      try {
        const anonVal = await localforage.getItem(anonKey);
        if (hasMeaningfulData(base, anonVal)) return true;
      } catch (err) {
        console.error(`❌ Failed to check anonymous data for ${base}:`, err);
        // Continue checking other stores
      }
    }
    return false;
  } catch (err) {
    console.error("❌ hasAnonData failed:", err);
    return false; // Fail gracefully - assume no data
  }
}

export async function clearAnonData(): Promise<void> {
  try {
    const results = await Promise.allSettled(
      BASES.map((base) => localforage.removeItem(`${base}-anon`))
    );
    
    // Log any failures but don't throw
    results.forEach((result, index) => {
      if (result.status === "rejected") {
        console.error(`❌ Failed to clear anonymous data for ${BASES[index]}:`, result.reason);
      }
    });
  } catch (err) {
    console.error("❌ clearAnonData failed:", err);
    // Don't throw - allow auth flow to continue
  }
}

export async function migrateAnonToUserAllStores(uid: string): Promise<void> {
  const errors: Array<{ base: Base; error: any }> = [];

  try {
    for (const base of BASES) {
      try {
        const anonKey = `${base}-anon`;
        const userKey = `${base}-${uid}`;

        const anonVal = await localforage.getItem(anonKey);
        if (!hasMeaningfulData(base, anonVal)) continue;

        const userVal = await localforage.getItem(userKey);

        const merged = mergePersisted(base, anonVal, userVal);
        if (merged) {
          await localforage.setItem(userKey, merged);
        }
      } catch (err: unknown) {
        console.error(`❌ Failed to migrate ${base}:`, err);
        errors.push({ base, error: err });
        // Continue with other stores
      }
    }

    // Always attempt to clear anonymous data, even if some migrations failed
    try {
      await clearAnonData();
    } catch (err) {
      console.error("❌ Failed to clear anonymous data after migration:", err);
    }

    // If any migrations failed, throw to prevent marking as handled
    if (errors.length > 0) {
      throw new Error(`Migration failed for ${errors.length} store(s): ${errors.map(e => e.base).join(", ")}`);
    }
  } catch (err) {
    console.error("❌ migrateAnonToUserAllStores failed:", err);
    throw err; // Re-throw to prevent marking as handled
  }
}