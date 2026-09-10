import emailjs from '@emailjs/browser';
import { collection, addDoc, query, where, getDocs, deleteDoc, doc, Timestamp, getFirestore } from 'firebase/firestore';
import { db } from '../lib/firebase';

/** Generate a cryptographically secure 6‑digit OTP */
export function generateOtp(): string {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  const num = array[0] % 1000000; // 0‑999999
  return num.toString().padStart(6, '0');
}

/** Store OTP in Firestore */
export async function storeOtp(officerId: string, email: string, otp: string) {
  const now = Timestamp.now();
  const expiresAt = Timestamp.fromMillis(Date.now() + 5 * 60 * 1000); // 5 min
  const docRef = await addDoc(collection(db, 'otp_logs'), {
    officerId,
    email,
    otp,
    createdAt: now,
    expiresAt,
    verified: false,
    attempts: 0,
  });
  return docRef.id;
}

/** Send OTP email via EmailJS */
export async function sendOtpEmail(email: string, otp: string, name: string) {
  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
  const templateParams = {
    otp,
    name,
    to_email: email,
  };
  try {
    await emailjs.send(serviceId, templateId, templateParams, publicKey);
    return { success: true };
  } catch (e) {
    console.error('EmailJS send error', e);
    return { success: false };
  }
}

/** Verify OTP against Firestore */
export async function verifyOtp(officerId: string, code: string) {
  const now = Timestamp.now();
  const q = query(
    collection(db, 'otp_logs'),
    where('officerId', '==', officerId),
    where('verified', '==', false)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return { success: false, error: 'No OTP found' };
  const docSnap = snapshot.docs[0];
  const data = docSnap.data() as {
    otp: string;
    expiresAt: Timestamp;
    attempts: number;
  };

  // Check expiration
  if (data.expiresAt.seconds * 1000 < Date.now()) {
    await deleteDoc(docSnap.ref);
    return { success: false, error: 'Verification Code Expired' };
  }

  // Check attempts limit
  if (data.attempts >= 5) {
    await deleteDoc(docSnap.ref);
    return { success: false, error: 'Maximum attempts exceeded' };
  }

  if (data.otp === code) {
    // Mark verified and delete the OTP document
    await deleteDoc(docSnap.ref);
    return { success: true };
  } else {
    // Increment attempts
    await docSnap.ref.update({ attempts: data.attempts + 1 });
    return { success: false, error: 'Incorrect verification code' };
  }
}

/** Cleanup any expired OTPs – called before new OTP generation */
export async function cleanupExpiredOtps() {
  const now = Timestamp.now();
  const q = query(
    collection(db, 'otp_logs'),
    where('expiresAt', '<=', now)
  );
  const snapshot = await getDocs(q);
  const deletions = snapshot.docs.map((d) => deleteDoc(d.ref));
  await Promise.all(deletions);
}
