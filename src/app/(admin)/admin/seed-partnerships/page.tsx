// src/app/(admin)/admin/seed-partnerships/page.tsx
'use client';

import { Button } from '@/components/ui/button';
import { useFirestore, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const pageToSeed = {
    id: "partenariats",
    title: "Partenariats d'entreprise",
    sections: [
        {
            id: "hero",
            title: "Partenariats d'entreprise",
            content: "Collaborez avec nous pour créer des solutions innovantes et atteindre un succès mutuel.",
            imageUrl: "https://picsum.photos/seed/partnerships-hero/1200/400"
        }
    ]
};

export default function SeedPartnershipsPage() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleSeed = () => {
    if (!firestore) return;

    const pageRef = doc(firestore, 'pages', pageToSeed.id);
    setDocumentNonBlocking(pageRef, pageToSeed, {});

    toast({
        title: "Seeding Initiated",
        description: "Your database is being populated with initial content for the 'Partenariats' page.",
    });
  };

  return (
    <div className="container mx-auto px-4 py-12 md:px-6">
       <Card>
        <CardHeader>
          <CardTitle>Partenariats d'entreprise Page Seeding</CardTitle>
          <CardDescription>
            Click the button below to populate your Firestore database with initial content for the 'Partenariats' page hero section.
            If content already exists for 'pages/partenariats', it will be overwritten.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button onClick={handleSeed}>Seed 'Partenariats' Page Content</Button>
        </CardContent>
      </Card>
    </div>
  );
}
