
// src/app/(admin)/admin/seed-not-found/page.tsx
'use client';

import { Button } from '@/components/ui/button';
import { useFirestore, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const pageToSeed = {
    id: "not-found",
    title: "Page Not Found",
    sections: [
        {
            id: "main",
            title: "Page Introuvable",
            content: "Désolé, la page que vous recherchez n'existe pas ou a été déplacée.",
            imageUrl: null,
        }
    ]
};

export default function SeedNotFoundPage() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleSeed = () => {
    if (!firestore) return;

    const pageRef = doc(firestore, 'pages', pageToSeed.id);
    setDocumentNonBlocking(pageRef, pageToSeed, {});

    toast({
        title: "Seeding Initiated",
        description: "Your database is being populated with content for the 'Not Found (404)' page.",
    });
  };

  return (
    <div className="container mx-auto px-4 py-12 md:px-6">
       <Card>
        <CardHeader>
          <CardTitle>404 Page Seeding</CardTitle>
          <CardDescription>
            Click the button below to populate your Firestore database with the default content for the 404 page.
            This will make the page and its content editable from the main dashboard.
            If content already exists for 'pages/not-found', it will be overwritten.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button onClick={handleSeed}>Seed 'Not Found' Page Content</Button>
        </CardContent>
      </Card>
    </div>
  );
}
