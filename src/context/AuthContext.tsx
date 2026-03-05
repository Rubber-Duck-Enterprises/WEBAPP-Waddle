import React, { createContext, useContext, useEffect, useMemo, useRef } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, initAuthPersistence, signInWithGoogle, signOutOnly } from "@/lib/firebase";

import { useSessionStore } from "@/stores/sessionStore";
import { setScopeGetter } from "@/lib/userScope";
import { resetUserStoresToEmpty, rehydrateAllStores } from "@/lib/resetUserStores";

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
    setScopeGetter(() => useSessionStore.getState().scope);
  }, []);

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

        try {
          const prevScope = useSessionStore.getState().scope;
          const isFirstLoad = lastHandledScopeRef.current === null;

          if (u) {
            console.log("👤 Usuario autenticado", { uid: u.uid, prevScope, nextScope });
            
            // ✅ Cambiar scope ANTES de rehydrate
            setUser(u, false);

            // 🚧 MIGRACIÓN TEMPORALMENTE DESHABILITADA PARA DEBUG
            // const isAnonToUser = prevScope === "anon" && nextScope !== "anon" && !isFirstLoad;
            const isAnonToUser = false;

            if (isAnonToUser) {
              // ✅ y SOLO si ese uid aún no fue manejado (no volver a preguntar)
              try {
                const alreadyHandled = await wasMigrationHandled(u.uid);

                if (!alreadyHandled) {
                  const anonHasData = await hasAnonData();

                  if (anonHasData) {
                    // mostramos modal y salimos (el modal se encarga del reset/rehydrate)
                    showModal(
                      getMigrateAnonDataModal({
                        onConfirm: async () => {
                          try {
                            await migrateAnonToUserAllStores(u.uid);
                            await markMigrationHandled(u.uid);
                          } catch (err) {
                            console.error("❌ Migration failed:", err);
                            // si falla, no marcamos handled para permitir reintento
                          } finally {
                            hideModal();
                            resetUserStoresToEmpty();
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
                            // Intentar marcar como handled de todos modos para no bloquear al usuario
                            try {
                              await markMigrationHandled(u.uid);
                            } catch (markErr) {
                              console.error("❌ Failed to mark migration as handled:", markErr);
                            }
                          } finally {
                            hideModal();
                            resetUserStoresToEmpty();
                            await rehydrateAllStores();
                            lastHandledScopeRef.current = nextScope;
                            setLoading(false);
                            processingRef.current = false;
                          }
                        },
                      })
                    );

                    return; // 👈 IMPORTANTÍSIMO: no continúes con el flujo normal
                  }

                  // No hay data anon, igual marcamos handled para no volver a checar
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

          // ✅ Solo rehydrate, NO reset
          console.log("🔄 Ejecutando rehydrate", { nextScope });
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
