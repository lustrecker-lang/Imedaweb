
// src/app/(admin)/admin/seed-careers/page.tsx
'use client';

import { Button } from '@/components/ui/button';
import { useFirestore, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const pageToSeed = {
    id: "careers",
    title: "Carrières",
    sections: [
        {
            id: "hero",
            title: "Carrières",
            content: "Rejoignez une équipe dynamique et innovante. Découvrez nos opportunités et construisons ensemble l'avenir.",
            imageUrl: "https://picsum.photos/seed/careers-hero/1200/400"
        }
    ]
};

export default function SeedCareersPage() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleSeed = () => {
    if (!firestore) return;

    const pageRef = doc(firestore, 'pages', pageToSeed.id);
    setDocumentNonBlocking(pageRef, pageToSeed, {});

    toast({
        title: "Seeding Initiated",
        description: "Your database is being populated with initial content for the 'Carrières' page.",
    });
  };

  return (
    <div className="container mx-auto px-4 py-12 md:px-6">
       <Card>
        <CardHeader>
          <CardTitle>Carrières Page Seeding</CardTitle>
          <CardDescription>
            Click the button below to populate your Firestore database with initial content for the 'Carrières' page hero section.
            If content already exists for 'pages/careers', it will be overwritten.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button onClick={handleSeed}>Seed 'Carrières' Page Content</Button>
        </CardContent>
      </Card>
    </div>
  );
}
