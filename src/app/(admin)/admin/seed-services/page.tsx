// src/app/(admin)/admin/seed-services/page.tsx
'use client';

import { Button } from '@/components/ui/button';
import { useFirestore, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const pageToSeed = {
    id: "services",
    title: "Services",
    sections: [
        {
            id: "hero",
            title: "Nos Services",
            content: "Des solutions sur mesure pour les entreprises, conçues pour la performance et la croissance.",
            imageUrl: "https://picsum.photos/seed/services-hero/1200/400"
        }
    ]
};

export default function SeedServicesPage() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleSeed = () => {
    if (!firestore) return;

    const pageRef = doc(firestore, 'pages', pageToSeed.id);
    setDocumentNonBlocking(pageRef, pageToSeed, {});

    toast({
        title: "Seeding Initiated",
        description: "Your database is being populated with initial content for the 'Services' page.",
    });
  };

  return (
    <div className="container mx-auto px-4 py-12 md:px-6">
       <Card>
        <CardHeader>
          <CardTitle>Services Page Seeding</CardTitle>
          <CardDescription>
            Click the button below to populate your Firestore database with initial content for the 'Services' page hero section.
            If content already exists for 'pages/services', it will be overwritten.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button onClick={handleSeed}>Seed 'Services' Page Content</Button>
        </CardContent>
      </Card>
    </div>
  );
}
