
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
            title: "Travaillez avec nous",
            content: "Rejoignez une équipe dynamique et innovante.",
            imageUrl: "https://picsum.photos/seed/careers-hero/1200/400"
        },
        {
            id: "value-1",
            title: "Innovation",
            content: "Nous encourageons la créativité et la recherche constante de nouvelles solutions pour façonner l'avenir.",
            imageUrl: "https://picsum.photos/seed/careers-value-1/600/600"
        },
        {
            id: "value-2",
            title: "Excellence",
            content: "Nous visons les plus hauts standards dans tout ce que nous entreprenons, de la pédagogie à nos relations partenaires.",
            imageUrl: "https://picsum.photos/seed/careers-value-2/600/600"
        },
        {
            id: "value-3",
            title: "Impact",
            content: "Notre objectif est de générer un impact positif et mesurable pour nos participants, nos partenaires et la société.",
            imageUrl: "https://picsum.photos/seed/careers-value-3/600/600"
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
        description: "Your database is being populated with the content for the 'Careers' page.",
    });
  };

  return (
    <div className="container mx-auto px-4 py-12 md:px-6">
       <Card>
        <CardHeader>
          <CardTitle>Careers Page Seeding</CardTitle>
          <CardDescription>
            Click the button below to populate your Firestore database with the new content sections for the 'Careers' page.
            This will make the page and its sections editable from the dashboard. This will overwrite any existing content for this page.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button onClick={handleSeed}>Seed 'Careers' Page Content</Button>
        </CardContent>
      </Card>
    </div>
  );
}
