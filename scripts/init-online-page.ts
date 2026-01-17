#!/usr/bin/env npx tsx

// Load environment variables FIRST
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Now import and initialize Firebase Admin directly
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin with credentials from .env.local
const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
    console.error('❌ Missing Firebase credentials in .env.local!');
    console.error('   Required: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY');
    process.exit(1);
}

const app = initializeApp({
    credential: cert(serviceAccount),
});

const adminDb = getFirestore(app);

async function initOnlinePage() {
    console.log('🔄 Initializing "pages/online" document...');

    try {
        const pageRef = adminDb.collection('pages').doc('online');
        const doc = await pageRef.get();

        if (doc.exists) {
            console.log('✅ "pages/online" already exists.');
            return;
        }

        const initialData = {
            id: 'online',
            title: 'Online Courses Page',
            ogTitle: 'Formations en Ligne | IMEDA',
            ogDescription: 'Découvrez nos formations en ligne pour les entreprises et les professionnels.',
            sections: [
                {
                    id: 'hero',
                    title: 'Formations en Ligne',
                    content: 'Solutions de formation flexibles pour les entreprises',
                    imageUrl: '' // Let user upload it via admin
                }
            ]
        };

        await pageRef.set(initialData);
        console.log('✅ Successfully created "pages/online"!');

    } catch (error) {
        console.error('❌ Error initializing online page:', error);
        process.exit(1);
    }
}

initOnlinePage();
