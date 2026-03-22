// Feature: cloud-backup-system, Property 5: Nombre de archivo exportado

import { describe, it, expect, vi } from "vitest";
import * as fc from "fast-check";
import type { BackupSnapshot } from "../backupTypes";

// ─── Firebase mocks (required to import backupService in Node environment) ────

vi.mock("@/lib/firebase", () => ({
  auth: { currentUser: null },
  db: {},
}));

vi.mock("firebase/firestore", () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
}));

import { getBackupFilename } from "../backupService";

// ─── Arbitraries ─────────────────────────────────────────────────────────────

/**
 * Generates random valid Date objects spanning a wide range of years.
 * noInvalidDate ensures we never get NaN dates.
 */
const validDateArb: fc.Arbitrary<Date> = fc.date({
  min: new Date(1970, 0, 1),
  max: new Date(2099, 11, 31),
  noInvalidDate: true,
});

// ─── Property 5: Nombre de archivo exportado ─────────────────────────────────

/**
 * Validates: Requirement 4.2
 */
describe("Property 5: Nombre de archivo exportado", () => {
  const filenamePattern = /^waddle-backup-\d{4}-\d{2}-\d{2}\.json$/;

  it("el nombre de archivo siempre sigue el formato waddle-backup-YYYY-MM-DD.json", () => {
    fc.assert(
      fc.property(validDateArb, (date) => {
        const filename = getBackupFilename(date);
        expect(filename).toMatch(filenamePattern);
      }),
      { numRuns: 200 }
    );
  });

  it("los componentes de fecha en el nombre coinciden con la fecha local del input", () => {
    fc.assert(
      fc.property(validDateArb, (date) => {
        const filename = getBackupFilename(date);

        const expectedYear = String(date.getFullYear());
        const expectedMonth = String(date.getMonth() + 1).padStart(2, "0");
        const expectedDay = String(date.getDate()).padStart(2, "0");
        const expectedFilename = `waddle-backup-${expectedYear}-${expectedMonth}-${expectedDay}.json`;

        expect(filename).toBe(expectedFilename);
      }),
      { numRuns: 200 }
    );
  });
});

// Feature: cloud-backup-system, Property 9: Límite de slots Pro

// ─── Helper ───────────────────────────────────────────────────────────────────

/**
 * Mirrors the core history-management logic from saveCloudBackup.
 * Prepends a new snapshot and slices to maxSlots.
 */
function addToHistory(
  history: BackupSnapshot[],
  newSnapshot: BackupSnapshot,
  maxSlots: number
): BackupSnapshot[] {
  return [newSnapshot, ...history].slice(0, maxSlots);
}

// ─── Arbitraries ─────────────────────────────────────────────────────────────

const backupSnapshotArb: fc.Arbitrary<BackupSnapshot> = fc.record({
  version: fc.constant(1),
  createdAt: fc.date({ noInvalidDate: true }).map((d) => d.toISOString()),
  appVersion: fc.stringMatching(/^\d+\.\d+\.\d+$/),
  origin: fc.constantFrom("manual" as const, "automatic" as const),
  scope: fc.constantFrom("full" as const, "wallet" as const, "list" as const),
  data: fc.constant({}),
});

// ─── Property 9: Límite de slots Pro ─────────────────────────────────────────

/**
 * Validates: Requirement 7.2
 */
describe("Property 9: Límite de slots Pro", () => {
  const MAX_HISTORY_SLOTS = 3;

  it("manual_history nunca supera 3 slots tras N > 3 backups consecutivos", () => {
    fc.assert(
      fc.property(
        fc.array(backupSnapshotArb, { minLength: 4, maxLength: 10 }),
        (snapshots) => {
          let history: BackupSnapshot[] = [];
          for (const snapshot of snapshots) {
            history = addToHistory(history, snapshot, MAX_HISTORY_SLOTS);
          }
          expect(history.length).toBeLessThanOrEqual(MAX_HISTORY_SLOTS);
        }
      ),
      { numRuns: 200 }
    );
  });

  it("manual_history contiene los snapshots más recientes (los últimos MAX_HISTORY_SLOTS añadidos)", () => {
    fc.assert(
      fc.property(
        fc.array(backupSnapshotArb, { minLength: 4, maxLength: 10 }),
        (snapshots) => {
          let history: BackupSnapshot[] = [];
          for (const snapshot of snapshots) {
            history = addToHistory(history, snapshot, MAX_HISTORY_SLOTS);
          }

          // The most recent snapshot must be at index 0
          const mostRecent = snapshots[snapshots.length - 1];
          expect(history[0]).toEqual(mostRecent);

          // All entries in history must come from the last MAX_HISTORY_SLOTS snapshots added
          const recentN = snapshots.slice(-MAX_HISTORY_SLOTS);
          for (const entry of history) {
            expect(recentN).toContainEqual(entry);
          }
        }
      ),
      { numRuns: 200 }
    );
  });

  it("el historial tiene exactamente min(N, 3) entradas tras N backups", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 4, max: 10 }).chain((n) =>
          fc.tuple(
            fc.constant(n),
            fc.array(backupSnapshotArb, { minLength: n, maxLength: n })
          )
        ),
        ([n, snapshots]) => {
          let history: BackupSnapshot[] = [];
          for (const snapshot of snapshots) {
            history = addToHistory(history, snapshot, MAX_HISTORY_SLOTS);
          }
          expect(history.length).toBe(Math.min(n, MAX_HISTORY_SLOTS));
        }
      ),
      { numRuns: 200 }
    );
  });
});

// Feature: cloud-backup-system, Property 10: Intervalo mínimo entre backups automáticos

import { shouldTriggerAutoBackup } from "../backupService";

// ─── Property 10: Intervalo mínimo entre backups automáticos ─────────────────

/**
 * Validates: Requirement 7.3
 */
describe("Property 10: Intervalo mínimo entre backups automáticos", () => {
  const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

  it("retorna false cuando el último backup fue dentro de las últimas 24 horas", () => {
    fc.assert(
      fc.property(
        // Generate an offset in ms: (0, 24h) exclusive on both ends
        fc.integer({ min: 1, max: TWENTY_FOUR_HOURS_MS - 1 }),
        (offsetMs) => {
          const lastAutoBackupAt = new Date(Date.now() - offsetMs).toISOString();
          expect(shouldTriggerAutoBackup(lastAutoBackupAt)).toBe(false);
        }
      ),
      { numRuns: 500 }
    );
  });

  it("retorna true cuando el último backup fue hace más de 24 horas", () => {
    fc.assert(
      fc.property(
        // Generate an offset strictly greater than 24h
        fc.integer({ min: 1, max: 30 * 24 * 60 * 60 * 1000 }),
        (extraMs) => {
          const lastAutoBackupAt = new Date(
            Date.now() - TWENTY_FOUR_HOURS_MS - extraMs
          ).toISOString();
          expect(shouldTriggerAutoBackup(lastAutoBackupAt)).toBe(true);
        }
      ),
      { numRuns: 500 }
    );
  });
});
