// Feature: cloud-backup-system, Property 1: Round-trip de serialización

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { serializeBackup, deserializeBackup } from "../backupSerializer";
import type { WalletStoreState, ListStoreState } from "../backupSerializer";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const hexColorArb: fc.Arbitrary<string> = fc
  .array(fc.integer({ min: 0, max: 255 }), { minLength: 3, maxLength: 3 })
  .map(([r, g, b]) => `#${r!.toString(16).padStart(2, "0")}${g!.toString(16).padStart(2, "0")}${b!.toString(16).padStart(2, "0")}`);

const isoDateArb: fc.Arbitrary<string> = fc
  .date({ min: new Date(2020, 0, 1), max: new Date(2030, 0, 1), noInvalidDate: true })
  .map((d) => d.toISOString());

// ─── Arbitraries ─────────────────────────────────────────────────────────────

const sectionArb = fc.record({
  id: fc.string({ minLength: 1, maxLength: 20 }),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  goal: fc.option(fc.float({ min: 0, max: 1_000_000, noNaN: true }), { nil: null }),
  color: fc.option(hexColorArb, { nil: undefined }),
  icon: fc.option(fc.string({ minLength: 1, maxLength: 10 }), { nil: undefined }),
  createdAt: isoDateArb,
  type: fc.option(
    fc.constantFrom<"standard" | "passive" | "card" | "savings">("standard", "passive", "card", "savings"),
    { nil: undefined }
  ),
});

const expenseArb = fc.record({
  id: fc.string({ minLength: 1, maxLength: 20 }),
  description: fc.string({ minLength: 1, maxLength: 100 }),
  amount: fc.float({ min: -1_000_000, max: 1_000_000, noNaN: true }),
  category: fc.string({ minLength: 1, maxLength: 30 }),
  source: fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: undefined }),
  date: isoDateArb,
  kind: fc.option(
    fc.constantFrom<"expense" | "income" | "debt" | "payment">("expense", "income", "debt", "payment"),
    { nil: undefined }
  ),
  recurring: fc.option(fc.boolean(), { nil: undefined }),
  notes: fc.option(fc.string({ maxLength: 200 }), { nil: undefined }),
  adjustment: fc.option(fc.boolean(), { nil: undefined }),
});

const walletStateArb: fc.Arbitrary<WalletStoreState> = fc.record({
  sections: fc.array(sectionArb, { maxLength: 5 }),
  expenses: fc.array(expenseArb, { maxLength: 10 }),
  hasFirstWallet: fc.boolean(),
});

const tagArb = fc.record({
  id: fc.string({ minLength: 1, maxLength: 20 }),
  name: fc.string({ minLength: 1, maxLength: 30 }),
  color: fc.option(hexColorArb, { nil: undefined }),
});

const taskArb = fc.record({
  id: fc.string({ minLength: 1, maxLength: 20 }),
  title: fc.string({ minLength: 1, maxLength: 100 }),
  isDone: fc.boolean(),
  createdAt: isoDateArb,
  dueDate: fc.option(isoDateArb, { nil: undefined }),
  notes: fc.option(fc.string({ maxLength: 200 }), { nil: undefined }),
  listId: fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: undefined }),
  priority: fc.option(
    fc.constantFrom<"low" | "medium" | "high">("low", "medium", "high"),
    { nil: undefined }
  ),
  reminders: fc.option(fc.array(fc.string({ minLength: 1, maxLength: 30 }), { maxLength: 3 }), { nil: undefined }),
  tags: fc.option(fc.array(fc.string({ minLength: 1, maxLength: 20 }), { maxLength: 3 }), { nil: undefined }),
});

const taskListArb = fc.record({
  id: fc.string({ minLength: 1, maxLength: 20 }),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  icon: fc.option(fc.string({ minLength: 1, maxLength: 10 }), { nil: undefined }),
  color: fc.option(hexColorArb, { nil: undefined }),
  sortOrder: fc.option(
    fc.constantFrom<"manual" | "dueDate" | "priority">("manual", "dueDate", "priority"),
    { nil: undefined }
  ),
  isArchived: fc.option(fc.boolean(), { nil: undefined }),
});

const tagsByListArb: fc.Arbitrary<Record<string, import("@/types").Tag[]>> = fc.dictionary(
  fc.string({ minLength: 1, maxLength: 20 }),
  fc.array(tagArb, { maxLength: 5 }),
  { maxKeys: 5 }
);

const listStateArb: fc.Arbitrary<ListStoreState> = fc.record({
  taskLists: fc.array(taskListArb, { maxLength: 5 }),
  tasks: fc.array(taskArb, { maxLength: 10 }),
  tagsByList: tagsByListArb,
  activeListId: fc.string({ minLength: 1, maxLength: 20 }),
});

// ─── Property 1: Round-trip de serialización ─────────────────────────────────

/**
 * Validates: Requirements 1.6, 1.1
 */
describe("Property 1: Round-trip de serialización", () => {
  it("serializar y deserializar produce un objeto equivalente al original", () => {
    fc.assert(
      fc.property(walletStateArb, listStateArb, (walletState, listState) => {
        const testUid = "test-user-123";

        // Serialize
        const snapshot = serializeBackup(walletState, listState, "manual", "full");

        // Deserialize
        const deserialized = deserializeBackup(snapshot, testUid);

        // Parse the JSON values from DeserializedData
        const parsedWallet = JSON.parse(deserialized.walletValue) as { state: WalletStoreState; version: number };
        const parsedList = JSON.parse(deserialized.listValue) as { state: ListStoreState; version: number };

        // Extract .state (Zustand persist wrapper)
        const restoredWallet = parsedWallet.state;
        const restoredList = parsedList.state;

        // Verify deep equality — compare after JSON round-trip on both sides
        // because JSON.stringify strips `undefined` fields and normalises -0 → 0,
        // which is the same transformation applied during serialization.
        const normalise = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
        expect(restoredWallet).toEqual(normalise(walletState));
        expect(restoredList).toEqual(normalise(listState));
      }),
      { numRuns: 100 }
    );
  });
});

// Feature: cloud-backup-system, Property 2: Campos requeridos siempre presentes

/**
 * Validates: Requirements 1.2, 4.5
 */
describe("Property 2: Campos requeridos siempre presentes", () => {
  const originArb = fc.constantFrom<"manual" | "automatic">("manual", "automatic");
  const scopeArb = fc.constantFrom<"full" | "wallet" | "list">("full", "wallet", "list");

  // Include empty stores as edge cases
  const emptyWalletState: WalletStoreState = { sections: [], expenses: [], hasFirstWallet: false };
  const emptyListState: ListStoreState = { taskLists: [], tasks: [], tagsByList: {}, activeListId: "" };

  const walletStateWithEmptyArb = fc.oneof(
    fc.constant(emptyWalletState),
    walletStateArb
  );

  const listStateWithEmptyArb = fc.oneof(
    fc.constant(emptyListState),
    listStateArb
  );

  it("el snapshot siempre contiene version, createdAt, appVersion, origin, scope y data no nulos", () => {
    fc.assert(
      fc.property(walletStateWithEmptyArb, listStateWithEmptyArb, originArb, scopeArb, (walletState, listState, origin, scope) => {
        const snapshot = serializeBackup(walletState, listState, origin, scope);

        // All required fields must be present and not null/undefined
        expect(snapshot.version).toBeDefined();
        expect(snapshot.version).not.toBeNull();

        expect(snapshot.createdAt).toBeDefined();
        expect(snapshot.createdAt).not.toBeNull();

        expect(snapshot.appVersion).toBeDefined();
        expect(snapshot.appVersion).not.toBeNull();

        expect(snapshot.origin).toBeDefined();
        expect(snapshot.origin).not.toBeNull();

        expect(snapshot.scope).toBeDefined();
        expect(snapshot.scope).not.toBeNull();

        expect(snapshot.data).toBeDefined();
        expect(snapshot.data).not.toBeNull();
      }),
      { numRuns: 100 }
    );
  });
});

// Feature: cloud-backup-system, Property 6: Scope de exportación parcial

/**
 * Validates: Requirements 4.3, 4.4
 */
describe("Property 6: Scope de exportación parcial", () => {
  const originArb = fc.constantFrom<"manual" | "automatic">("manual", "automatic");

  it('scope "wallet": data.wallet está definido y data.list es undefined', () => {
    fc.assert(
      fc.property(walletStateArb, listStateArb, originArb, (walletState, listState, origin) => {
        const snapshot = serializeBackup(walletState, listState, origin, "wallet");

        expect(snapshot.data.wallet).toBeDefined();
        expect(snapshot.data.list).toBeUndefined();
      }),
      { numRuns: 100 }
    );
  });

  it('scope "list": data.list está definido y data.wallet es undefined', () => {
    fc.assert(
      fc.property(walletStateArb, listStateArb, originArb, (walletState, listState, origin) => {
        const snapshot = serializeBackup(walletState, listState, origin, "list");

        expect(snapshot.data.list).toBeDefined();
        expect(snapshot.data.wallet).toBeUndefined();
      }),
      { numRuns: 100 }
    );
  });

  it('scope "full": tanto data.wallet como data.list están definidos', () => {
    fc.assert(
      fc.property(walletStateArb, listStateArb, originArb, (walletState, listState, origin) => {
        const snapshot = serializeBackup(walletState, listState, origin, "full");

        expect(snapshot.data.wallet).toBeDefined();
        expect(snapshot.data.list).toBeDefined();
      }),
      { numRuns: 100 }
    );
  });
});

// Feature: cloud-backup-system, Property 7: Validación rechaza snapshots inválidos

import { validateSnapshot } from "../backupSerializer";

/**
 * Validates: Requirements 5.1, 5.4
 */
describe("Property 7: Validación rechaza snapshots inválidos", () => {
  // Arbitrary for objects missing `version`
  const missingVersionArb = fc.record({
    createdAt: fc.string(),
    data: fc.record({ wallet: fc.object() }),
  });

  // Arbitrary for objects missing `createdAt`
  const missingCreatedAtArb = fc.record({
    version: fc.integer(),
    data: fc.record({ wallet: fc.object() }),
  });

  // Arbitrary for objects missing `data`
  const missingDataArb = fc.record({
    version: fc.integer(),
    createdAt: fc.string(),
  });

  // Arbitrary for objects with `data: null`
  const nullDataArb = fc.record({
    version: fc.integer(),
    createdAt: fc.string(),
    data: fc.constant(null),
  });

  // Arbitrary for objects with `version` as a string instead of number
  const stringVersionArb = fc.record({
    version: fc.string(),
    createdAt: fc.string(),
    data: fc.record({ wallet: fc.object() }),
  });

  // Completely random objects (may accidentally be valid, so we use oneof below)
  const randomObjectArb = fc.object();

  // Union of all invalid shapes
  const invalidSnapshotArb = fc.oneof(
    fc.constant(null),
    fc.string(),
    fc.integer(),
    fc.boolean(),
    missingVersionArb,
    missingCreatedAtArb,
    missingDataArb,
    nullDataArb,
    stringVersionArb,
    randomObjectArb,
  );

  it("validateSnapshot retorna false para cualquier objeto sin las claves requeridas", () => {
    fc.assert(
      fc.property(invalidSnapshotArb, (obj) => {
        // A random object could accidentally satisfy all constraints, so we
        // only assert false when we know the object is structurally invalid.
        // For the specific invalid shapes we generate, the result must be false.
        const result = validateSnapshot(obj);

        // For the deterministic invalid shapes (non-object, null, missing keys,
        // wrong types) the result MUST be false.
        if (obj === null || typeof obj !== "object") {
          expect(result).toBe(false);
          return;
        }

        const record = obj as Record<string, unknown>;

        const hasValidVersion = typeof record["version"] === "number";
        const hasValidCreatedAt = typeof record["createdAt"] === "string";
        const hasValidData = record["data"] !== null && typeof record["data"] === "object";

        if (!hasValidVersion || !hasValidCreatedAt || !hasValidData) {
          expect(result).toBe(false);
        }
        // If all three happen to be present and valid (random object coincidence),
        // we don't assert — that would be a valid snapshot.
      }),
      { numRuns: 200 }
    );
  });

  it("validateSnapshot retorna false para null", () => {
    expect(validateSnapshot(null)).toBe(false);
  });

  it("validateSnapshot retorna false para primitivos", () => {
    fc.assert(
      fc.property(fc.oneof(fc.string(), fc.integer(), fc.boolean()), (primitive) => {
        expect(validateSnapshot(primitive)).toBe(false);
      }),
      { numRuns: 50 }
    );
  });

  it("validateSnapshot retorna false cuando falta version", () => {
    fc.assert(
      fc.property(missingVersionArb, (obj) => {
        expect(validateSnapshot(obj)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it("validateSnapshot retorna false cuando falta createdAt", () => {
    fc.assert(
      fc.property(missingCreatedAtArb, (obj) => {
        expect(validateSnapshot(obj)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it("validateSnapshot retorna false cuando falta data", () => {
    fc.assert(
      fc.property(missingDataArb, (obj) => {
        expect(validateSnapshot(obj)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it("validateSnapshot retorna false cuando data es null", () => {
    fc.assert(
      fc.property(nullDataArb, (obj) => {
        expect(validateSnapshot(obj)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it("validateSnapshot retorna false cuando version es string en lugar de number", () => {
    fc.assert(
      fc.property(stringVersionArb, (obj) => {
        expect(validateSnapshot(obj)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });
});
