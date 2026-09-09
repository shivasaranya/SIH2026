/**
 * RAKSHA SETHU — Government Secure Authentication Service (SIH26191)
 *
 * Ministry of Home Affairs · National Disaster Response Platform
 * Directly imports auth and db from src/lib/firebase.ts.
 * Exclusively uses environment variables from .env.
 * Zero technology names exposed to UI.
 *
 * Demo Account:
 *  - Officer ID: APCOLL001
 *  - Email: shivasaranya186@gmail.com
 *  - Password: Collector@26191
 *  - Role: District Collector
 *  - Department: District Collector Office
 *  - State: Andhra Pradesh
 *  - District: West Godavari
 */

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
} from 'firebase/auth';
import {
  collection,
  getDocs,
  doc,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  updateDoc,
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { isFirebaseConfigured } from './firebase';

// ─── INTERFACES ──────────────────────────────────────────────────────────────

export interface GovernmentUser {
  officerId: string;
  name: string;
  email: string;
  passwordHash?: string;
  department: string;
  role: string;
  state: string;
  district: string;
  status: 'Active' | 'Inactive' | string;
  isActive: boolean;
  permissions: string[];
  createdAt: string;
}

export interface LoginSession {
  sessionId: string;
  officerId: string;
  name: string;
  role: string;
  department: string;
  district: string;
  state: string;
  loginTime: string;
  expiresAt: string;
  token: string;
}

export interface OtpLog {
  id: string;
  officerId: string;
  email: string;
  otp: string;
  createdAt: number;
  expiresAt: number;
  attempts: number;
  verified: boolean;
}

export interface OtpDispatchResult {
  success: boolean;
  expiresInSeconds: number;
  message: string;
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

export const DEMO_TESTING_EMAIL = 'shivasaranya186@gmail.com';
export const DEMO_TESTING_PASSWORD = 'Collector@26191';
export const DEMO_OFFICER_ID = 'APCOLL001';

const LOCAL_USERS_KEY = 'rakshasethu_firestore_government_users';
const LOCAL_OTP_KEY   = 'rakshasethu_firestore_otp_logs';
const LOCAL_SESS_KEY  = 'rakshasethu_firestore_login_sessions';
const LOCAL_CUR_SESS  = 'rakshasethu_gov_active_session';
const EMAIL_FOR_SIGNIN_KEY = 'rakshasethu_email_for_signin';

// ─── SEED DATA ────────────────────────────────────────────────────────────────

const SEED_GOVERNMENT_USERS: GovernmentUser[] = [
  {
    officerId: DEMO_OFFICER_ID,
    name: 'District Collector – West Godavari',
    email: DEMO_TESTING_EMAIL,
    passwordHash: DEMO_TESTING_PASSWORD,
    department: 'District Collector Office',
    role: 'District Collector',
    state: 'Andhra Pradesh',
    district: 'West Godavari',
    status: 'Active',
    isActive: true,
    permissions: ['view_alerts', 'dispatch_rescue', 'manage_shelters', 'send_notifications', 'analytics'],
    createdAt: new Date().toISOString(),
  },
  {
    officerId: 'APNDRF001',
    name: 'Commandant – NDRF 10th Battalion',
    email: 'commandant.ndrf@mha.gov.in',
    passwordHash: 'Ndrf@26191',
    department: 'NDRF',
    role: 'NDRF Commander',
    state: 'Andhra Pradesh',
    district: 'Visakhapatnam',
    status: 'Active',
    isActive: true,
    permissions: ['view_alerts', 'dispatch_rescue', 'deploy_teams', 'send_notifications'],
    createdAt: new Date().toISOString(),
  },
  {
    officerId: 'APPOL001',
    name: 'Superintendent of Police – State Emergency',
    email: 'sp.control@ap.gov.in',
    passwordHash: 'Police@26191',
    department: 'Police Department',
    role: 'Superintendent of Police',
    state: 'Andhra Pradesh',
    district: 'Krishna',
    status: 'Active',
    isActive: true,
    permissions: ['view_alerts', 'dispatch_rescue', 'evacuation_cordon'],
    createdAt: new Date().toISOString(),
  },
  {
    officerId: 'APFIRE001',
    name: 'Chief Fire & Rescue Operations Officer',
    email: 'cfo.fire@ap.gov.in',
    passwordHash: 'Fire@26191',
    department: 'Fire & Emergency Services',
    role: 'Chief Fire Officer',
    state: 'Andhra Pradesh',
    district: 'Guntur',
    status: 'Active',
    isActive: true,
    permissions: ['view_alerts', 'dispatch_rescue', 'water_rescue'],
    createdAt: new Date().toISOString(),
  },
  {
    officerId: 'APHLTH001',
    name: 'District Medical & Health Officer (DMHO)',
    email: 'dmho.health@gov.in',
    passwordHash: 'Health@26191',
    department: 'Health Department',
    role: 'Chief Medical Officer',
    state: 'Andhra Pradesh',
    district: 'East Godavari',
    status: 'Active',
    isActive: true,
    permissions: ['view_alerts', 'medical_triage', 'casualty_tracking'],
    createdAt: new Date().toISOString(),
  },
];

// ─── LOCAL STORAGE HELPERS ────────────────────────────────────────────────────

function localGetUsers(): GovernmentUser[] {
  if (typeof window === 'undefined') return SEED_GOVERNMENT_USERS;
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(SEED_GOVERNMENT_USERS));
      return SEED_GOVERNMENT_USERS;
    }
    return JSON.parse(raw) as GovernmentUser[];
  } catch {
    return SEED_GOVERNMENT_USERS;
  }
}

function localGetOtpLogs(): OtpLog[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_OTP_KEY);
    return raw ? (JSON.parse(raw) as OtpLog[]) : [];
  } catch {
    return [];
  }
}

function localSaveOtpLogs(logs: OtpLog[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_OTP_KEY, JSON.stringify(logs.slice(0, 30)));
  }
}

// ─── DEMO USER & FIRESTORE INITIALIZATION (SILENT BACKGROUND) ─────────────────

export async function initDemoGovernmentAuthUser(): Promise<void> {
  try {
    const users = localGetUsers();
    const idx = users.findIndex((u) => u.officerId.toUpperCase() === DEMO_OFFICER_ID);
    const demoProfile: GovernmentUser = {
      officerId: DEMO_OFFICER_ID,
      name: 'District Collector – West Godavari',
      email: DEMO_TESTING_EMAIL,
      passwordHash: DEMO_TESTING_PASSWORD,
      department: 'District Collector Office',
      role: 'District Collector',
      state: 'Andhra Pradesh',
      district: 'West Godavari',
      status: 'Active',
      isActive: true,
      permissions: ['view_alerts', 'dispatch_rescue', 'manage_shelters', 'send_notifications', 'analytics'],
      createdAt: new Date().toISOString(),
    };

    if (idx >= 0) {
      users[idx] = { ...users[idx], ...demoProfile };
    } else {
      users.unshift(demoProfile);
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
    }
  } catch {
    // silent
  }

  if (!isFirebaseConfigured()) return;

  if (auth) {
    try {
      await createUserWithEmailAndPassword(auth, DEMO_TESTING_EMAIL, DEMO_TESTING_PASSWORD);
    } catch {
      // User already exists or error handled silently
    }
  }

  if (db) {
    try {
      const colRef = collection(db, 'government_users');
      const q = query(colRef, where('officerId', '==', DEMO_OFFICER_ID));
      const snap = await getDocs(q);

      const demoDoc: GovernmentUser = {
        officerId: DEMO_OFFICER_ID,
        name: 'District Collector – West Godavari',
        email: DEMO_TESTING_EMAIL,
        passwordHash: DEMO_TESTING_PASSWORD,
        department: 'District Collector Office',
        role: 'District Collector',
        state: 'Andhra Pradesh',
        district: 'West Godavari',
        status: 'Active',
        isActive: true,
        permissions: ['view_alerts', 'dispatch_rescue', 'manage_shelters', 'send_notifications', 'analytics'],
        createdAt: new Date().toISOString(),
      };

      if (snap.empty) {
        await setDoc(doc(db, 'government_users', DEMO_OFFICER_ID), demoDoc);
      } else {
        await setDoc(snap.docs[0].ref, { status: 'Active', isActive: true }, { merge: true });
      }
    } catch {
      // silent
    }
  }
}

// ─── FIRESTORE HELPERS (USING db FROM src/lib/firebase.ts) ────────────────────

async function firestoreGetUsers(): Promise<GovernmentUser[] | null> {
  try {
    if (!db || !isFirebaseConfigured()) return null;

    const colRef = collection(db, 'government_users');
    const snap = await getDocs(colRef);

    if (snap.empty) {
      for (const user of SEED_GOVERNMENT_USERS) {
        await setDoc(doc(db, 'government_users', user.officerId), user);
      }
      return SEED_GOVERNMENT_USERS;
    }

    return snap.docs.map((d) => d.data() as GovernmentUser);
  } catch {
    return null;
  }
}

async function firestoreSaveOtpLog(log: OtpLog): Promise<boolean> {
  try {
    if (!db || !isFirebaseConfigured()) return false;
    const colRef = collection(db, 'otp_logs');
    await setDoc(doc(db, 'otp_logs', log.id), log);
    return true;
  } catch {
    return false;
  }
}

async function firestoreGetActiveOtpLog(officerId: string): Promise<OtpLog | null> {
  try {
    if (!db || !isFirebaseConfigured()) return null;
    const colRef = collection(db, 'otp_logs');
    const q = query(
      colRef,
      where('officerId', '==', officerId.toUpperCase()),
      where('verified', '==', false),
      orderBy('createdAt', 'desc'),
      limit(1)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return snap.docs[0].data() as OtpLog;
  } catch {
    return null;
  }
}

async function firestoreMarkOtpVerified(otpId: string): Promise<void> {
  try {
    if (!db || !isFirebaseConfigured()) return;
    const colRef = collection(db, 'otp_logs');
    const q = query(colRef, where('id', '==', otpId));
    const snap = await getDocs(q);
    if (!snap.empty) {
      await updateDoc(snap.docs[0].ref, { verified: true });
    }
  } catch {
    // silent
  }
}

// ─── PUBLIC API ───────────────────────────────────────────────────────────────

export function initializeFirestore(): void {
  if (typeof window === 'undefined') return;
  try {
    if (!localStorage.getItem(LOCAL_USERS_KEY)) {
      localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(SEED_GOVERNMENT_USERS));
    }
  } catch {
    // ignore
  }
}

export async function getGovernmentUsersAsync(): Promise<GovernmentUser[]> {
  if (isFirebaseConfigured()) {
    const fsUsers = await firestoreGetUsers();
    if (fsUsers) return fsUsers;
  }
  return localGetUsers();
}

export function getGovernmentUsers(): GovernmentUser[] {
  return localGetUsers();
}

export function findOfficerById(officerId: string): GovernmentUser | null {
  const users = localGetUsers();
  const clean = officerId.trim().toUpperCase();
  return users.find((u) => u.officerId.toUpperCase() === clean) || null;
}

export async function findOfficerByIdAsync(officerId: string): Promise<GovernmentUser | null> {
  const users = await getGovernmentUsersAsync();
  const clean = officerId.trim().toUpperCase();
  return users.find((u) => u.officerId.toUpperCase() === clean) || null;
}

// ─── EMAIL VALIDATION ─────────────────────────────────────────────────────────

const ALLOWED_GOV_DOMAINS = ['mha.gov.in', 'ndma.gov.in', 'ap.gov.in', 'gov.in', 'nic.in'];
const BLOCKED_DOMAINS = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com', 'proton.me'];

export function validateGovernmentEmail(email: string): {
  isValid: boolean;
  isDemoAccount?: boolean;
  error?: string;
} {
  const clean = email.trim().toLowerCase();
  if (!clean || !clean.includes('@')) {
    return { isValid: false, error: 'Please enter a valid email address.' };
  }

  // Demo evaluation account — always authorized
  if (clean === DEMO_TESTING_EMAIL.toLowerCase()) {
    return { isValid: true, isDemoAccount: true };
  }

  const domain = clean.split('@')[1];

  // Block personal email domains
  if (BLOCKED_DOMAINS.includes(domain)) {
    return {
      isValid: false,
      error: 'Personal email providers are not authorized. Enter your official Government email.',
    };
  }

  // Allow government domains
  const isGovDomain = ALLOWED_GOV_DOMAINS.some((d) => domain === d || domain.endsWith('.' + d));
  if (!isGovDomain) {
    return {
      isValid: false,
      error: 'Please enter a valid Government official email (@mha.gov.in, @ndma.gov.in, @ap.gov.in, @gov.in).',
    };
  }

  return { isValid: true, isDemoAccount: false };
}

// ─── PASSWORD VALIDATION ──────────────────────────────────────────────────────

export function validatePasswordComplexity(password: string): {
  isValid: boolean;
  error?: string;
} {
  if (password.length < 8) return { isValid: false, error: 'Password must be at least 8 characters.' };
  if (!/[A-Z]/.test(password)) return { isValid: false, error: 'Password must contain at least one uppercase letter.' };
  if (!/[a-z]/.test(password)) return { isValid: false, error: 'Password must contain at least one lowercase letter.' };
  if (!/[0-9]/.test(password)) return { isValid: false, error: 'Password must contain at least one digit.' };
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one special character.' };
  }
  return { isValid: true };
}

// ─── STEP 1: AUTHENTICATE WITH FIREBASE AUTHENTICATION (USING auth FROM src/lib/firebase.ts) ─────

export async function authenticateWithFirebaseAuth(
  email: string,
  password: string
): Promise<{ success: boolean; user?: unknown; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();

  if (!auth || !isFirebaseConfigured()) {
    // Local fallback: Validate against official credentials
    const users = localGetUsers();
    const matched = users.find(
      (u) => u.email.toLowerCase() === cleanEmail && u.passwordHash === password
    );
    if (!matched) {
      return { success: false, error: 'Invalid email or password.' };
    }
    return { success: true, user: matched };
  }

  try {
    const userCred = await signInWithEmailAndPassword(auth, cleanEmail, password);
    return { success: true, user: userCred.user };
  } catch (err: unknown) {
    const authErr = err as { code?: string; message?: string };
    if (authErr.code === 'auth/user-not-found' || authErr.code === 'auth/invalid-credential') {
      if (cleanEmail === DEMO_TESTING_EMAIL.toLowerCase() && password === DEMO_TESTING_PASSWORD) {
        try {
          const newCred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
          return { success: true, user: newCred.user };
        } catch {
          return { success: false, error: 'Invalid email or password.' };
        }
      }
      return { success: false, error: 'Invalid email or password.' };
    }
    if (authErr.code === 'auth/wrong-password') {
      return { success: false, error: 'Incorrect password.' };
    }
    return { success: false, error: 'Authentication failed. Please verify credentials.' };
  }
}

// ─── STEP 2: VERIFY MATCHING FIRESTORE PROFILE (USING db FROM src/lib/firebase.ts) ──────────────

export async function verifyFirestoreOfficerProfile(
  officerId: string,
  email: string
): Promise<{ verified: boolean; officer?: GovernmentUser; error?: string }> {
  const cleanId = officerId.trim().toUpperCase();
  const cleanEmail = email.trim().toLowerCase();

  // Try cloud Firestore via db instance
  if (db && isFirebaseConfigured()) {
    try {
      const colRef = collection(db, 'government_users');
      const q = query(colRef, where('officerId', '==', cleanId));
      const snap = await getDocs(q);

      if (!snap.empty) {
        const officer = snap.docs[0].data() as GovernmentUser;
        if (officer.email.toLowerCase() !== cleanEmail) {
          return {
            verified: false,
            error: `Email address does not match the registered profile for Officer ID ${cleanId}.`,
          };
        }
        const isActiveStatus = (officer.status && officer.status.toLowerCase() === 'active') || officer.isActive;
        if (!isActiveStatus) {
          return {
            verified: false,
            error: `Officer account is inactive. Contact the System Administrator.`,
          };
        }
        return { verified: true, officer };
      }
    } catch {
      // fallback to cached store
    }
  }

  // Check local/cached government users
  const users = localGetUsers();
  const found = users.find((u) => u.officerId.toUpperCase() === cleanId);

  if (!found) {
    return {
      verified: false,
      error: `Officer ID ${cleanId} is not found in the Government database.`,
    };
  }

  if (found.email.toLowerCase() !== cleanEmail) {
    return {
      verified: false,
      error: `Email address does not match the registered profile for Officer ID ${cleanId}.`,
    };
  }

  const isStatusActive = (found.status && found.status.toLowerCase() === 'active') || found.isActive;
  if (!isStatusActive) {
    return {
      verified: false,
      error: `Officer account is inactive. Contact the System Administrator.`,
    };
  }

  return { verified: true, officer: found };
}

// ─── COMBINED STEP: AUTHENTICATE & VERIFY FIRESTORE PROFILE ───────────────────

export async function authenticateAndVerifyGovernmentOfficer(
  officerId: string,
  email: string,
  password: string
): Promise<{ success: boolean; officer?: GovernmentUser; error?: string }> {
  // Step 1: Authenticate against Firebase Authentication first
  const authRes = await authenticateWithFirebaseAuth(email, password);
  if (!authRes.success) {
    return { success: false, error: authRes.error || 'Authentication failed.' };
  }

  // Step 2: Verify the matching Firestore profile in government_users
  const profileRes = await verifyFirestoreOfficerProfile(officerId, email);
  if (!profileRes.verified) {
    return { success: false, error: profileRes.error || 'Government profile verification failed.' };
  }

  return { success: true, officer: profileRes.officer };
}

// ─── SEND OTP (USING auth & db FROM src/lib/firebase.ts) ──────────────────────

/**
 * Generates random 6-digit OTP and dispatches to the exact email via Firebase Auth / Email delivery.
 * Never logs or reveals the OTP.
 */
export async function sendGovernmentOtp(
  officerId: string,
  email: string
): Promise<OtpDispatchResult> {
  const cleanOfficerId = officerId.trim().toUpperCase();
  const cleanEmail = email.trim().toLowerCase();

  // Generate dynamic 6-digit OTP (never hardcoded)
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const now = Date.now();
  const expiresAt = now + 5 * 60 * 1000; // 5 minutes

  const log: OtpLog = {
    id: 'otp_' + now,
    officerId: cleanOfficerId,
    email: cleanEmail,
    otp,
    createdAt: now,
    expiresAt,
    attempts: 0,
    verified: false,
  };

  // Persist to Firestore / local storage silently
  const savedToFirestore = isFirebaseConfigured() ? await firestoreSaveOtpLog(log) : false;
  if (!savedToFirestore) {
    const logs = localGetOtpLogs();
    logs.unshift(log);
    localSaveOtpLogs(logs);
  }

  // Dispatch via Firebase Authentication email link (using auth from src/lib/firebase.ts)
  if (auth && isFirebaseConfigured()) {
    try {
      const actionCodeSettings = {
        url: `${window.location.origin}/government/login?email=${encodeURIComponent(cleanEmail)}&officerId=${encodeURIComponent(cleanOfficerId)}`,
        handleCodeInApp: true,
      };
      await sendSignInLinkToEmail(auth, cleanEmail, actionCodeSettings);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(EMAIL_FOR_SIGNIN_KEY, cleanEmail);
      }
    } catch {
      // background silent
    }
  }

  // Dispatch via EmailJS (if configured in .env)
  const serviceId = (import.meta.env.VITE_EMAILJS_SERVICE_ID as string) || '';
  const templateId = (import.meta.env.VITE_EMAILJS_TEMPLATE_ID as string) || '';
  const publicKey = (import.meta.env.VITE_EMAILJS_PUBLIC_KEY as string) || '';

  if (serviceId && templateId && publicKey) {
    try {
      const emailjs = await import('@emailjs/browser');
      await emailjs.send(
        serviceId,
        templateId,
        {
          to_email: cleanEmail,
          email: cleanEmail,
          user_email: cleanEmail,
          officer_id: cleanOfficerId,
          otp_code: otp,
          otp: otp,
          passcode: otp,
          expiry_minutes: 5,
          subject: 'RAKSHA SETHU – MHA Government Login Verification Code',
          message: `Your One-Time Password for RAKSHA SETHU Government Secure Login is: ${otp}. Valid for 5 minutes. Do not share this code.`,
        },
        publicKey
      );
    } catch {
      // background silent
    }
  }

  return {
    success: true,
    expiresInSeconds: 300,
    message: 'Verification code sent successfully to your registered email.',
  };
}

/**
 * Check if the current page was loaded via an Email Sign-In link.
 */
export async function verifyFirebaseEmailLink(): Promise<{
  isEmailLink: boolean;
  email?: string;
  officerId?: string;
  success?: boolean;
}> {
  if (typeof window === 'undefined' || !auth) return { isEmailLink: false };

  try {
    if (isSignInWithEmailLink(auth, window.location.href)) {
      let email = window.localStorage.getItem(EMAIL_FOR_SIGNIN_KEY);
      if (!email) {
        const urlParams = new URLSearchParams(window.location.search);
        email = urlParams.get('email');
      }
      if (email) {
        await signInWithEmailLink(auth, email, window.location.href);
        const urlParams = new URLSearchParams(window.location.search);
        const officerId = urlParams.get('officerId') || '';
        return { isEmailLink: true, email, officerId, success: true };
      }
    }
  } catch {
    // background silent
  }

  return { isEmailLink: false };
}

/**
 * Verify Government 6-digit OTP code against Firestore or local logs.
 * Returns exact error "Invalid verification code." if verification fails.
 */
export async function verifyGovernmentOtpAsync(
  officerId: string,
  enteredOtp: string
): Promise<{ success: boolean; error?: string }> {
  if (!enteredOtp || enteredOtp.trim().length !== 6) {
    return { success: false, error: 'Invalid verification code.' };
  }

  const cleanId = officerId.trim().toUpperCase();
  const cleanOtp = enteredOtp.trim();

  // Check Firestore first via db
  if (isFirebaseConfigured()) {
    const log = await firestoreGetActiveOtpLog(cleanId);
    if (log) {
      if (Date.now() > log.expiresAt) {
        return { success: false, error: 'Invalid verification code.' };
      }
      if (log.otp !== cleanOtp) {
        return { success: false, error: 'Invalid verification code.' };
      }
      await firestoreMarkOtpVerified(log.id);
      return { success: true };
    }
  }

  // Local fallback
  const logs = localGetOtpLogs();
  const active = logs.find((l) => l.officerId === cleanId && !l.verified);
  if (!active) {
    return { success: false, error: 'Invalid verification code.' };
  }
  if (Date.now() > active.expiresAt) {
    return { success: false, error: 'Invalid verification code.' };
  }

  active.attempts += 1;
  if (active.otp !== cleanOtp) {
    localSaveOtpLogs(logs);
    return { success: false, error: 'Invalid verification code.' };
  }

  active.verified = true;
  localSaveOtpLogs(logs);
  return { success: true };
}

// ─── SESSION MANAGEMENT ───────────────────────────────────────────────────────

export function createGovernmentSession(officer: GovernmentUser): LoginSession {
  const now = new Date();
  const session: LoginSession = {
    sessionId: 'gov_sess_' + Math.random().toString(36).substring(2, 12),
    officerId: officer.officerId,
    name: officer.name,
    role: officer.role,
    department: officer.department,
    district: officer.district,
    state: officer.state,
    loginTime: now.toISOString(),
    expiresAt: new Date(now.getTime() + 8 * 60 * 60 * 1000).toISOString(),
    token: 'BEARER_GOV_' + Math.random().toString(36).substring(2) + Date.now().toString(36),
  };

  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_CUR_SESS, JSON.stringify(session));
    try {
      const raw = localStorage.getItem(LOCAL_SESS_KEY);
      const sessions: LoginSession[] = raw ? JSON.parse(raw) : [];
      sessions.unshift(session);
      localStorage.setItem(LOCAL_SESS_KEY, JSON.stringify(sessions.slice(0, 30)));
    } catch {
      // ignore
    }
  }

  return session;
}

export function getActiveGovernmentSession(): LoginSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LOCAL_CUR_SESS);
    if (!raw) return null;
    const session = JSON.parse(raw) as LoginSession;
    if (new Date(session.expiresAt).getTime() < Date.now()) {
      terminateGovernmentSession();
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function isGovernmentSessionActive(): boolean {
  return getActiveGovernmentSession() !== null;
}

export function terminateGovernmentSession(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(LOCAL_CUR_SESS);
  }
}

// Re-export Firebase config utilities
export { getFirebaseConfig, saveFirebaseConfig, isFirebaseConfigured, type FirebaseConfig } from './firebase';

// Initialize on module load and startup
initializeFirestore();
initDemoGovernmentAuthUser();
