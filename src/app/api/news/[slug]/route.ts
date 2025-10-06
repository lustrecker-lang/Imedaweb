
import { adminDb } from '@/firebase/admin';
import { NextRequest, NextResponse } from 'next/server';
import { DocumentData } from 'firebase-admin/firestore';

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  const { slug } = params;

  if (!slug) {
    return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
  }

  try {
    const newsRef = adminDb.collection('news');
    const slugQuerySnapshot = await newsRef.where('slug', '==', slug).limit(1).get();

    let docSnap;
    if (!slugQuerySnapshot.empty) {
      docSnap = slugQuerySnapshot.docs[0];
    } else {
      // Fallback to checking by ID if no slug match
      docSnap = await newsRef.doc(slug).get();
    }
    
    if (docSnap && docSnap.exists) {
      const data = docSnap.data() as DocumentData;
      const publicationDate = data.publicationDate?.toDate();
      
      const story = {
        id: docSnap.id,
        ...data,
        publicationDate: publicationDate ? publicationDate.toISOString() : null,
      };
      
      return NextResponse.json(story);
    } else {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }
  } catch (error) {
    console.error(`[API/NEWS/${slug}] Error fetching story:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
