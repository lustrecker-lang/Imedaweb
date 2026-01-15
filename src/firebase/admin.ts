import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// 1. Prepare Local Credentials (used only when running locally)
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

let adminApp: App;

if (!getApps().length) {
  // 2. Check if we have a Private Key (aka: Are we Local?)
  if (process.env.FIREBASE_PRIVATE_KEY) {
    // LOCAL: Use the keys from .env.local
    adminApp = initializeApp({
      credential: cert(serviceAccount),
    });
  } else {
    // PROD (App Hosting): Use Automatic Google Credentials
    // No parameters needed; App Hosting logs in for you!
    adminApp = initializeApp({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID // Optional helper
    });
  }
} else {
  adminApp = getApps()[0];
}

const adminDb = getFirestore(adminApp);

export { adminApp, adminDb };