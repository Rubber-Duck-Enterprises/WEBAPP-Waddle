// src/firebase.ts
import { initializeApp } from "firebase/app";
import {
  getMessaging,
  getToken,
  onMessage,
} from "firebase/messaging";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  User,
  signOut,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
} from "firebase/firestore";
import { useSettingsStore } from "./stores/settingsStore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);
const auth = getAuth(app);
const db = getFirestore(app);

// 🔐 Iniciar sesión con Google y eliminar registro anónimo
export const signInWithGoogle = async (): Promise<User | null> => {
  const provider = new GoogleAuthProvider();
  await signInWithPopup(auth, provider); // 🔐 Login con Google

  const anonUid = localStorage.getItem("anonUserId");
  if (anonUid) {
    try {
      await deleteDoc(doc(db, "public-users", anonUid));
      console.log(`🗑️ Eliminado registro anónimo: public-users/${anonUid}`);
    } catch (e) {
      console.warn("⚠️ No se pudo eliminar el registro anónimo:", e);
    }
    localStorage.removeItem("anonUserId");
  }

  const currentUser = auth.currentUser as User | null;

  if (currentUser) {
    await currentUser.reload();
  } else {
    await new Promise((r) => setTimeout(r, 500));
    const refreshedUser = auth.currentUser as User | null;
    if (refreshedUser) {
      await refreshedUser.reload();
    }
  }

  return auth.currentUser ?? null;
};

// 🔌 Cerrar sesión y restaurar notificaciones anónimas
export const signOutAndRestoreAnonymous = async (): Promise<void> => {
  const token = await requestPermissionAndToken();
  const { dayStartTime, dayEndTime } = useSettingsStore.getState();
  const anonId = crypto.randomUUID();

  await setDoc(doc(db, "public-users", anonId), {
    fcmToken: token ?? null,
    dayStartTime,
    dayEndTime,
  });

  localStorage.setItem("anonUserId", anonId);
  await signOut(auth);
  console.log(`🔄 Usuario desconectado. Restaurado como public-users/${anonId}`);
};

// ☁ Subir respaldo a Firestore
export const saveBackupToCloud = async (data: any): Promise<void> => {
  const user = auth.currentUser;
  if (!user) throw new Error("Usuario no autenticado");

  const ref = doc(db, "backups", user.uid);
  await setDoc(ref, {
    data,
    updatedAt: new Date().toISOString(),
    email: user.email,
  });
};

// ☁ Obtener respaldo desde Firestore
export const loadBackupFromCloud = async (): Promise<any | null> => {
  const user = auth.currentUser;
  if (!user) throw new Error("Usuario no autenticado");

  const ref = doc(db, "backups", user.uid);
  const snapshot = await getDoc(ref);
  return snapshot.exists() ? snapshot.data().data : null;
};

// 🔔 FCM: Permiso y token
export const requestPermissionAndToken = async (): Promise<string | null> => {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;

    const registration = await navigator.serviceWorker.ready;
    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    console.log("✅ Token FCM:", token);
    return token;
  } catch (error) {
    console.error("❌ Error al obtener token FCM:", error);
    return null;
  }
};

// 🔔 Guardar configuración en Firestore con logs detallados
export const saveNotificationSettingsToFirestore = async (
  fcmToken: string,
  user?: User | null
) => {
  const { dayStartTime, dayEndTime } = useSettingsStore.getState();
  const currentUser = user ?? auth.currentUser;
  const anonId = localStorage.getItem("anonUserId");
  const uid = currentUser?.uid || anonId || crypto.randomUUID();

  console.log("🧠 Estado inicial:");
  console.log(" - Usuario autenticado:", currentUser?.uid ?? "❌ No autenticado");
  console.log(" - anonId localStorage:", anonId);
  console.log(" - dayStartTime:", dayStartTime);
  console.log(" - dayEndTime:", dayEndTime);
  console.log(" - fcmToken:", fcmToken);

  if (!currentUser && !anonId) {
    localStorage.setItem("anonUserId", uid);
    console.log("🆕 Guardado anonId nuevo:", uid);
  }

  // Migrar si aplica
  if (currentUser && anonId) {
    const anonRef = doc(db, "public-users", anonId);
    const anonDoc = await getDoc(anonRef);

    if (anonDoc.exists()) {
      const userRef = doc(db, "users", currentUser.uid);
      await setDoc(userRef, {
        ...anonDoc.data(),
        fcmToken,
        dayStartTime,
        dayEndTime,
      }, { merge: true });

      await deleteDoc(anonRef);
      localStorage.removeItem("anonUserId");
      console.log("✅ Migrado de anon -> users:", userRef.path);
      return;
    } else {
      console.warn("⚠️ Documento anónimo no existe.");
    }
  }

  const targetRef = doc(db, currentUser ? "users" : "public-users", uid);
  await setDoc(targetRef, {
    fcmToken,
    dayStartTime,
    dayEndTime,
  }, { merge: true });

  console.log("✅ Preferencias de notificación guardadas en:", targetRef.path);
};

// 📩 Mensajes en foreground
export const listenToMessages = (callback: (payload: any) => void) => {
  onMessage(messaging, (payload) => {
    console.log("📨 Mensaje recibido en foreground:", payload);
    callback(payload);
  });
};

export { app, messaging, auth };
