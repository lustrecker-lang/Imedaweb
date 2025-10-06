
// src/app/(admin)/admin/seed-references/page.tsx
'use client';

import { Button } from '@/components/ui/button';
import { useFirestore, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const pageToSeed = {
    id: "references",
    title: "Références",
    sections: [
        {
            id: "hero",
            title: "Nos Références",
            content: "Découvrez les organisations qui nous font confiance pour la formation et le développement des compétences de leurs équipes.",
            imageUrl: "https://picsum.photos/seed/references-hero/1200/400"
        }
    ]
};

export default function SeedReferencesPage() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleSeed = () => {
    if (!firestore) return;

    const pageRef = doc(firestore, 'pages', pageToSeed.id);
    setDocumentNonBlocking(pageRef, pageToSeed, {});

    toast({
        title: "Seeding Initiated",
        description: "Your database is being populated with initial content for the 'Références' page.",
    });
  };

  return (
    <div className="container mx-auto px-4 py-12 md:px-6">
       <Card>
        <CardHeader>
          <CardTitle>Références Page Seeding</CardTitle>
          <CardDescription>
            Click the button below to populate your Firestore database with initial content for the 'Références' page hero section.
            If content already exists for 'pages/references', it will be overwritten.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button onClick={handleSeed}>Seed 'Références' Page Content</Button>
        </CardContent>
      </Card>
    </div>
  );
}
