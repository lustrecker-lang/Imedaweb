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

// New USD base prices for all courses
const NEW_PRIX_SANS_HEBERGEMENT = '5865';
const NEW_PRIX_AVEC_HEBERGEMENT = '7990';

async function updateCoursePrices() {
    console.log('🔄 Starting bulk price update for all courses...');
    console.log(`   New "prixSansHebergement": ${NEW_PRIX_SANS_HEBERGEMENT} USD`);
    console.log(`   New "prixAvecHebergement": ${NEW_PRIX_AVEC_HEBERGEMENT} USD`);
    console.log('');

    try {
        const formationsRef = adminDb.collection('course_formations');
        const snapshot = await formationsRef.get();

        if (snapshot.empty) {
            console.log('❌ No courses found in course_formations collection!');
            return;
        }

        console.log(`📚 Found ${snapshot.size} courses to update.`);
        console.log('');

        let updatedCount = 0;

        // Process in batches of 500 (Firestore limit)
        const batchSize = 500;
        let batch = adminDb.batch();
        let batchCount = 0;

        for (const doc of snapshot.docs) {
            const docRef = formationsRef.doc(doc.id);
            batch.update(docRef, {
                prixSansHebergement: NEW_PRIX_SANS_HEBERGEMENT,
                prixAvecHebergement: NEW_PRIX_AVEC_HEBERGEMENT,
            });

            batchCount++;
            updatedCount++;

            // Commit batch when it reaches the limit
            if (batchCount >= batchSize) {
                await batch.commit();
                console.log(`   ✅ Committed batch of ${batchCount} updates...`);
                batch = adminDb.batch();
                batchCount = 0;
            }
        }

        // Commit any remaining updates
        if (batchCount > 0) {
            await batch.commit();
            console.log(`   ✅ Committed final batch of ${batchCount} updates.`);
        }

        console.log('');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`✅ Successfully updated ${updatedCount} courses!`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    } catch (error) {
        console.error('❌ Error updating prices:', error);
        process.exit(1);
    }
}

updateCoursePrices();
