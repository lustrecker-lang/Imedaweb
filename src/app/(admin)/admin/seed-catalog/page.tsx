
// src/app/(admin)/admin/seed-catalog/page.tsx
'use client';

import { Button } from '@/components/ui/button';
import { useFirestore, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const pageToSeed = {
    id: "catalog",
    title: "Catalog Page",
    sections: [
        {
            id: "hero",
            title: "Télécharger le catalogue",
            content: "Entrez votre e-mail pour recevoir le catalogue complet de nos formations 2025-26.",
            imageUrl: "https://picsum.photos/seed/catalog-page/600/800"
        }
    ]
};

export default function SeedCatalogPage() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleSeed = () => {
    if (!firestore) return;

    const pageRef = doc(firestore, 'pages', pageToSeed.id);
    setDocumentNonBlocking(pageRef, pageToSeed, {});

    toast({
        title: "Seeding Initiated",
        description: "Your database is being populated with content for the 'Catalog' page.",
    });
  };

  return (
    <div className="container mx-auto px-4 py-12 md:px-6">
       <Card>
        <CardHeader>
          <CardTitle>Catalog Page Seeding</CardTitle>
          <CardDescription>
            Click the button below to populate your Firestore database with the content for the 'Catalog' page.
            This will make the page editable from the dashboard. This will overwrite any existing content for this page.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button onClick={handleSeed}>Seed 'Catalog' Page Content</Button>
        </CardContent>
      </Card>
    </div>
  );
}
