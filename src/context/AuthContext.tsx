import React, { createContext, useContext, useEffect, useMemo, useRef } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, initAuthPersistence, signInWithGoogle, signOutOnly } from "@/lib/firebase";

import { useSessionStore } from "@/stores/sessionStore";
import { pauseAllStores, resumeAllStores, resetUserStoresToEmpty, rehydrateAllStores } from "@/lib/resetUserStores";

import { useModal } from "@/context/ModalContext";
import { getMigrateAnonDataModal } from "@/components/Modal/Presets/Account/MigrateAnonDataModal";
import { hasAnonData, migrateAnonToUserAllStores, clearAnonData } from "@/lib/userScopedMigrations";
import { wasMigrationHandled, markMigrationHandled } from "@/lib/migrationFlags";

type AuthCtx = {
  user: User | null;
  loading: boolean;
  scope: string;
  isPro: boolean;

  loginGoogle: () => Promise<User | null>;
  logoutToAnon: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { user, loading, scope, isPro, setAnon, setUser, setLoading } = useSessionStore();
  const { showModal, hideModal } = useModal();

  // ✅ evita que el handler corra múltiples veces para el mismo estado
  const lastHandledScopeRef = useRef<string | null>(null);
  const processingRef = useRef(false);

  useEffect(() => {
    (async () => {
      await initAuthPersistence();

      const unsub = onAuthStateChanged(auth, async (u) => {
        console.log("🔥 onAuthStateChanged", { uid: u?.uid || "null", lastHandled: lastHandledScopeRef.current });
        
        // anti re-entrada
        if (processingRef.current) return;

        const nextScope = u?.uid ?? "anon";

        // ✅ si el scope no cambió, NO hagas nada (evita "refresh")
        if (lastHandledScopeRef.current === nextScope) {
          console.log("⏭️ Scope no cambió, skipping");
          return;
        }

        processingRef.current = true;
        setLoading(true);

        // Pausar persistencia ANTES de cambiar scope para evitar que
        // setState/reset escriban datos del scope anterior al nuevo scope.
        pauseAllStores();

        try {
          const prevScope = useSessionStore.getState().scope;

          if (u) {
            console.log("👤 Usuario autenticado", { uid: u.uid, prevScope, nextScope });
            
            // ✅ Cambiar scope ANTES de rehydrate
            setUser(u, false);

            const isAnonToUser = prevScope === "anon" && !!u;

            if (isAnonToUser) {
              try {
                const alreadyHandled = await wasMigrationHandled(u.uid);

                if (!alreadyHandled) {
                  const anonHasData = await hasAnonData();

                  if (anonHasData) {
                    // Mostramos modal — el modal se encarga del flujo completo.
                    // La persistencia permanece PAUSADA hasta que el modal termine.
                    showModal(
                      getMigrateAnonDataModal({
                        onConfirm: async () => {
                          try {
                            // 1. Migrar datos anon al scope del usuario en localforage
                            await migrateAnonToUserAllStores(u.uid);
                            await markMigrationHandled(u.uid);
                          } catch (err) {
                            console.error("❌ Migration failed:", err);
                            // Aún así intentamos marcar como handled para no repetir
                            try { await markMigrationHandled(u.uid); } catch {}
                          } finally {
                            hideModal();
                            // 2. Rehydratar SIN resetear — los datos merged ya están en localforage.
                            //    Primero resumimos persistence para que el rehydrate pueda leer.
                            resumeAllStores();
                            await rehydrateAllStores();
                            lastHandledScopeRef.current = nextScope;
                            setLoading(false);
                            processingRef.current = false;
                          }
                        },
                        onCancel: async () => {
                          try {
                            await clearAnonData();
                            await markMigrationHandled(u.uid);
                          } catch (err) {
                            console.error("❌ Clear anonymous data failed:", err);
                            try { await markMigrationHandled(u.uid); } catch {}
                          } finally {
                            hideModal();
                            // Rehydratar datos del usuario (sin datos anon mezclados)
                            resumeAllStores();
                            await rehydrateAllStores();
                            lastHandledScopeRef.current = nextScope;
                            setLoading(false);
                            processingRef.current = false;
                          }
                        },
                      })
                    );

                    return; // 👈 No continuar con el flujo normal
                  }

                  // No hay data anon — marcar como handled para no volver a checar
                  await markMigrationHandled(u.uid);
                }
              } catch (err) {
                console.error("❌ Migration check failed:", err);
                // Si falla la verificación, continuar con flujo normal sin bloquear auth
              }
            }
          } else {
            console.log("👻 Usuario anónimo", { prevScope, nextScope });
            setAnon();
          }

          // Solo resetear si el scope cambió realmente (no en el primer load).
          const isFirstLoad = lastHandledScopeRef.current === null;
          if (!isFirstLoad) {
            // Pausa ya activa — reset no escribe al storage
            resetUserStoresToEmpty();
          }
          console.log("🔄 Ejecutando rehydrate", { nextScope, isFirstLoad });
          // rehydrate reactiva internamente la persistencia al terminar
          resumeAllStores();
          await rehydrateAllStores();
          console.log("✅ Rehydrate completado");

          lastHandledScopeRef.current = nextScope;
        } finally {
          setLoading(false);
          processingRef.current = false;
        }
      });

      return () => unsub();
    })();
  }, [setAnon, setUser, setLoading, showModal, hideModal]);

  const api = useMemo<AuthCtx>(
    () => ({
      user,
      loading,
      scope,
      isPro,

      loginGoogle: async () => {
        const u = await signInWithGoogle();
        return u;
      },

      logoutToAnon: async () => {
        await signOutOnly();
      },
    }),
    [user, loading, scope, isPro]
  );

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
};

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used within AuthProvider");
  return v;
}
