// src/app/(admin)/admin/seed-presentation/page.tsx
'use client';

import { Button } from '@/components/ui/button';
import { useFirestore, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const pageToSeed = {
    id: "presentation",
    title: "Présentation",
    sections: [
        {
            id: "hero",
            title: "Présentation",
            content: "Découvrez qui nous sommes, notre vision et notre engagement envers l'excellence.",
            imageUrl: "https://picsum.photos/seed/presentation-hero/1200/400"
        }
    ]
};

export default function SeedPresentationPage() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleSeed = () => {
    if (!firestore) return;

    const pageRef = doc(firestore, 'pages', pageToSeed.id);
    setDocumentNonBlocking(pageRef, pageToSeed, {});

    toast({
        title: "Seeding Initiated",
        description: "Your database is being populated with initial content for the 'Présentation' page.",
    });
  };

  return (
    <div className="container mx-auto px-4 py-12 md:px-6">
       <Card>
        <CardHeader>
          <CardTitle>Présentation Page Seeding</CardTitle>
          <CardDescription>
            Click the button below to populate your Firestore database with initial content for the 'Présentation' page hero section.
            If content already exists for 'pages/presentation', it will be overwritten.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button onClick={handleSeed}>Seed 'Présentation' Page Content</Button>
        </CardContent>
      </Card>
    </div>
  );
}
