import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  User,
  signOut,
  setPersistence,
  indexedDBLocalPersistence,
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { useSettingsStore } from "@/stores/settingsStore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const messaging = getMessaging(app);

export const initAuthPersistence = async () => {
  try {
    await setPersistence(auth, indexedDBLocalPersistence);
  } catch (error) {
    console.error("💥 initAuthPersistence:", error);
    await setPersistence(auth, browserLocalPersistence);
  }
};

// ✅ Login Google (sin link anon)
export const signInWithGoogle = async (): Promise<User | null> => {
  const provider = new GoogleAuthProvider();
  const res = await signInWithPopup(auth, provider);
  await res.user.reload();
  return res.user ?? null;
};

// ✅ Register email
export const signUpWithEmail = async (email: string, password: string, displayName?: string) => {
  const cred = await createUserWithEmailAndPassword(auth, email, password);

  if (displayName) {
    await updateProfile(cred.user, { displayName });
  }

  await sendEmailVerification(cred.user);
  return cred.user;
};

// ✅ Login email (sin link anon)
export const signInWithEmail = async (email: string, password: string) => {
  const res = await signInWithEmailAndPassword(auth, email, password);
  return res.user;
};

export const resetPassword = async (email: string) => {
  await sendPasswordResetEmail(auth, email);
};

// ✅ Logout simple (no anon)
export const signOutOnly = async (): Promise<void> => {
  await signOut(auth);
};

// ---------- helpers ----------
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const withTimeout = async <T,>(p: Promise<T>, ms: number, fallback: T): Promise<T> => {
  return (await Promise.race([p, sleep(ms).then(() => fallback)])) as T;
};

// 🔔 FCM: token (solo si hay usuario real logueado)
export const requestPermissionAndToken = async (): Promise<string | null> => {
  try {
    if (import.meta.env.DEV) return null;

    // 👇 si no hay user, no pidas permisos
    if (!auth.currentUser) return null;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;

    if (!("serviceWorker" in navigator)) return null;

    const reg = await navigator.serviceWorker.getRegistration();

    const registration =
      reg ??
      (await withTimeout<ServiceWorkerRegistration | null>(
        navigator.serviceWorker.ready as Promise<ServiceWorkerRegistration>,
        1500,
        null
      ));

    if (!registration) return null;

    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    return token ?? null;
  } catch (error) {
    console.error("❌ Error al obtener token FCM:", error);
    return null;
  }
};

// ☁ Backups: exige usuario real (ya no existe anon firebase)
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

// 🔔 Preferencias: SOLO si hay user (nada de public-users)
export const saveNotificationSettingsToFirestore = async (fcmToken: string, user?: User | null) => {
  const activeUser = user ?? auth.currentUser;
  if (!activeUser) return; // 👈 sin user no guardes nada en firestore

  const { dayStartTime, dayEndTime } = useSettingsStore.getState();

  const ref = doc(db, "users", activeUser.uid);
  await setDoc(ref, { fcmToken, dayStartTime, dayEndTime }, { merge: true });
};

export { app, auth, db, messaging };