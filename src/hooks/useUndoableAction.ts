import { useCallback, useRef } from "react";

interface UndoableActionOptions {
  /** Tiempo en ms antes de ejecutar la acción real (default: 4000) */
  delayMs?: number;
  /** Callback al iniciar (antes del delay) — útil para ocultar el item en la UI */
  onStart?: () => void;
  /** Callback al expirar el timer (acción ejecutada permanentemente) */
  onCommit: () => void;
  /** Callback si se deshace la acción */
  onUndo?: () => void;
}

/**
 * Hook para acciones "deshacer" (undo) con soft-delete temporal.
 *
 * Uso:
 * ```ts
 * const { execute, undo, isPending } = useUndoableAction({
 *   onStart: () => setHiddenIds(prev => [...prev, id]),
 *   onCommit: () => deleteExpense(id),
 *   onUndo: () => setHiddenIds(prev => prev.filter(x => x !== id)),
 * });
 * ```
 */
export function useUndoableAction(options: UndoableActionOptions) {
  const { delayMs = 4000, onStart, onCommit, onUndo } = options;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef(false);

  const execute = useCallback(() => {
    if (pendingRef.current) return;
    pendingRef.current = true;
    onStart?.();

    timerRef.current = setTimeout(() => {
      pendingRef.current = false;
      timerRef.current = null;
      onCommit();
    }, delayMs);
  }, [delayMs, onStart, onCommit]);

  const undo = useCallback(() => {
    if (!pendingRef.current) return;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    pendingRef.current = false;
    onUndo?.();
  }, [onUndo]);

  const isPending = () => pendingRef.current;

  return { execute, undo, isPending };
}
