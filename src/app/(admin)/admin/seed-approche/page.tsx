// src/app/(admin)/admin/seed-approche/page.tsx
'use client';

import { Button } from '@/components/ui/button';
import { useFirestore, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const pageToSeed = {
    id: "notre-approche",
    title: "Notre Approche",
    sections: [
        {
            id: "hero",
            title: "Notre Approche",
            content: "Découvrez la méthodologie unique et les principes fondamentaux qui guident chacune de nos interventions et formations.",
            imageUrl: "https://picsum.photos/seed/approach-hero/1200/400"
        }
    ]
};

export default function SeedApprochePage() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleSeed = () => {
    if (!firestore) return;

    const pageRef = doc(firestore, 'pages', pageToSeed.id);
    setDocumentNonBlocking(pageRef, pageToSeed, {});

    toast({
        title: "Seeding Initiated",
        description: "Your database is being populated with initial content for the 'Notre approche' page.",
    });
  };

  return (
    <div className="container mx-auto px-4 py-12 md:px-6">
       <Card>
        <CardHeader>
          <CardTitle>Notre Approche Page Seeding</CardTitle>
          <CardDescription>
            Click the button below to populate your Firestore database with initial content for the 'Notre approche' page hero section.
            If content already exists for 'pages/notre-approche', it will be overwritten.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button onClick={handleSeed}>Seed 'Notre approche' Page Content</Button>
        </CardContent>
      </Card>
    </div>
  );
}
