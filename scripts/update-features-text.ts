
import { adminDb } from '../src/firebase/admin.ts';

async function updateFeaturesText() {
    console.log('Updating features text...');
    try {
        const featuresDocRef = adminDb.collection('pages').doc('features');
        const doc = await featuresDocRef.get();

        if (!doc.exists) {
            console.log('Features document not found!');
            return;
        }

        const data = doc.data();
        if (!data || !data.sections) {
            console.log('No sections found in features document');
            return;
        }

        const updatedSections = data.sections.map((section: any) => {
            if (section.id === 'features') {
                return {
                    ...section,
                    title: 'L\'Excellence Académique', // Ensure title is correct
                    content: 'Nos programmes de formation sont conçus pour répondre aux plus hauts standards internationaux, alliant théorie approfondie et pratique professionnelle.' // French replacement
                };
            }
            return section;
        });

        await featuresDocRef.update({
            sections: updatedSections
        });

        console.log('Successfully updated features text.');
    } catch (error) {
        console.error('Error:', error);
    }
}

updateFeaturesText();
