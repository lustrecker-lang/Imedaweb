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

async function addOnlineSection() {
    console.log('🔄 Adding "online-section" to pages/home...');

    try {
        const homeRef = adminDb.collection('pages').doc('home');
        const doc = await homeRef.get();

        if (!doc.exists) {
            console.log('❌ pages/home document not found!');
            return;
        }

        const data = doc.data();
        const sections = data?.sections || [];

        // Check if section already exists
        if (sections.some((s: any) => s.id === 'online-section')) {
            console.log('✅ "online-section" already exists. Updating values if necessary...');
            // Optional: update it here if you want to force specific values
        } else {
            sections.push({
                id: 'online-section',
                title: 'IMEDA Online',
                content: 'Accédez à nos formations 100% en ligne. Flexibilité totale, diplôme identique.',
                imageUrl: '' // Initially empty as requested "background image and so on"
            });
            await homeRef.update({ sections });
            console.log('✅ Successfully added "online-section" to pages/home!');
        }

    } catch (error) {
        console.error('❌ Error updating pages/home:', error);
        process.exit(1);
    }
}

addOnlineSection();
