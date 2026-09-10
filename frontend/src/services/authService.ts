import { auth, db } from '../lib/firebase';
import { signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import type { GovernmentUser, LoginSession } from './firebaseAuth';

/**
 * Log in a user via Firebase Authentication.
 * Returns the authenticated Firebase user or an error string.
 */
export async function firebaseLogin(email: string, password: string) {
  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    return { user: credential.user };
  } catch (e: any) {
    // Hide underlying Firebase error details from UI.
    return { error: 'Authentication failed' };
  }
}

/**
 * Verify the Government profile stored in Firestore.
 * Must match officerId, email, department, state, district and be active.
 */
export async function verifyGovernmentProfile(
  officerId: string,
  email: string,
  department: string,
  state: string,
  district: string
) {
  try {
    const docRef = doc(db, 'government_users', officerId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return { ok: false, error: 'Profile not found' };
    const data = snap.data() as GovernmentUser;
    const matches =
      data.email === email &&
      data.department === department &&
      data.state === state &&
      data.district === district &&
      data.isActive === true;
    if (!matches) return { ok: false, error: 'Profile mismatch' };
    return { ok: true, user: data };
  } catch (e) {
    return { ok: false, error: 'Verification error' };
  }
}

/**
 * Create a secure session document in Firestore and return its ID.
 */
export async function createGovernmentSession(user: GovernmentUser) {
  try {
    const token = await auth.currentUser?.getIdToken();
    const session: LoginSession = {
      sessionId: '', // will be filled by Firestore auto‑ID
      officerId: user.officerId,
      name: user.name,
      role: user.role,
      department: user.department,
      district: user.district,
      state: user.state,
      loginTime: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h session
      token: token ?? '',
    };
    const sessRef = await addDoc(collection(db, 'government_sessions'), {
      ...session,
      createdAt: serverTimestamp(),
    });
    // Update sessionId after creation
    await setDoc(sessRef, { sessionId: sessRef.id }, { merge: true });
    return { sessionId: sessRef.id };
  } catch (e) {
    return { error: 'Session creation failed' };
  }
}

/**
 * Sign out from Firebase and clean any local session data.
 */
export async function signOutGov() {
  try {
    await signOut(auth);
    // Local storage cleanup is handled by AuthContext.
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

/**
 * Ensure the demo account exists in both Firebase Auth and Firestore.
 * Runs once on module import (development only).
 */
async function ensureDemoAccount() {
  const demoEmail = 'shivasaranya186@gmail.com';
  const demoPassword = 'Collector@26191';
  const demoOfficerId = 'APCOLL001';

  // 1. Ensure Firestore document exists.
  const userDocRef = doc(db, 'government_users', demoOfficerId);
  const userSnap = await getDoc(userDocRef);
  if (!userSnap.exists()) {
    await setDoc(userDocRef, {
      officerId: demoOfficerId,
      name: 'District Collector – West Godavari',
      email: demoEmail,
      department: 'District Collector Office',
      role: 'District Collector',
      state: 'Andhra Pradesh',
      district: 'West Godavari',
      status: 'Active',
      isActive: true,
      permissions: [],
      createdAt: new Date().toISOString(),
    });
  }

  // 2. Ensure Firebase Auth user exists – attempt creation, ignore if already exists.
  try {
    await signInWithEmailAndPassword(auth, demoEmail, demoPassword);
  } catch {
    // If sign‑in fails, try to create the user.
    try {
      await createUserWithEmailAndPassword(auth, demoEmail, demoPassword);
    } catch {
      // Swallow errors – user may already exist.
    }
  }
}

// Execute auto‑creation in dev mode.
if (import.meta.env.DEV) {
  ensureDemoAccount();
}
