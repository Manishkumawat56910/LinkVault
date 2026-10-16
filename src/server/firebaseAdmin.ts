import { initializeApp, getApps, getApp, cert, ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import firebaseConfig from '../../firebase-applet-config.json';

import fs from 'fs';

function getServiceAccount(): ServiceAccount {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) {
    if (fs.existsSync('./service-account.json')) {
      return JSON.parse(fs.readFileSync('./service-account.json', 'utf8'));
    }
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT environment variable is missing. ' +
      'Please provide your Firebase service account JSON in .env or service-account.json.'
    );
  }
  try {
    return JSON.parse(raw);
  } catch (err: any) {
    throw new Error(`Failed to parse FIREBASE_SERVICE_ACCOUNT JSON: ${err.message}`);
  }
}

const serviceAccount = getServiceAccount();

const app = getApps().find(a => a.name === 'vault-admin')
  ? getApp('vault-admin')
  : initializeApp(
      {
        credential: cert(serviceAccount),
        projectId: firebaseConfig.projectId,
      },
      'vault-admin'
    );

export const adminDb = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const adminAuth = getAuth(app);
export default app;

/**
 * Checks that Firebase credentials are valid by making a real
 * Firestore request. Call this once at server startup.
 * If credentials are bad (e.g. revoked service-account.json key),
 * this will throw with a clear error message instead of silently
 * failing on every API request later.
 */
export async function checkFirebaseConnection(): Promise<void> {
  try {
    // A lightweight Firestore read — just fetches metadata, no documents needed
    await adminDb.collection('_healthcheck').limit(1).get();
  } catch (err: any) {
    // Detect the specific "key is revoked/invalid" error
    if (
      err.code === 16 ||
      err?.message?.includes('UNAUTHENTICATED') ||
      err?.message?.includes('invalid_grant') ||
      err?.message?.includes('invalid authentication credentials')
    ) {
      throw new Error(
        '\n' +
        '╔══════════════════════════════════════════════════════════════╗\n' +
        '║        ❌  FIREBASE CREDENTIALS ARE INVALID OR REVOKED      ║\n' +
        '╠══════════════════════════════════════════════════════════════╣\n' +
        '║  Your service-account.json key has been revoked or deleted  ║\n' +
        '║  in Google Cloud Console.                                   ║\n' +
        '║                                                             ║\n' +
        '║  HOW TO FIX:                                                ║\n' +
        '║  1. Go to: console.cloud.google.com                         ║\n' +
        '║  2. IAM & Admin → Service Accounts                         ║\n' +
        '║  3. Click firebase-adminsdk → KEYS tab                     ║\n' +
        '║  4. Add Key → Create new key → JSON → Download             ║\n' +
        '║  5. Replace service-account.json in project root           ║\n' +
        '║  6. Run npm run dev again                                   ║\n' +
        '╚══════════════════════════════════════════════════════════════╝\n'
      );
    }
    // Any other Firestore error — still rethrow but with context
    throw new Error(`Firebase connection check failed: ${err.message}`);
  }
}
