// src/app/(admin)/admin/seed-publications/page.tsx
'use client';

import { Button } from '@/components/ui/button';
import { useFirestore, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const pageToSeed = {
    id: "publications",
    title: "Publications Page",
    sections: [
        {
            id: "hero",
            title: "Publications",
            content: "Explore our latest articles, research, and insights from our experts.",
            imageUrl: "https://picsum.photos/seed/publications-hero/1200/400"
        }
    ]
};

export default function SeedPublicationsPage() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleSeed = () => {
    if (!firestore) return;

    const pageRef = doc(firestore, 'pages', pageToSeed.id);
    setDocumentNonBlocking(pageRef, pageToSeed, {});

    toast({
        title: "Seeding Initiated",
        description: "Your database is being populated with initial content for the publications page.",
    });
  };

  return (
    <div className="container mx-auto px-4 py-12 md:px-6">
       <Card>
        <CardHeader>
          <CardTitle>Publications Page Seeding</CardTitle>
          <CardDescription>
            Click the button below to populate your Firestore database with initial content for the publications page hero section.
            If content already exists for 'pages/publications', it will be overwritten.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button onClick={handleSeed}>Seed Publications Page Content</Button>
        </CardContent>
      </Card>
    </div>
  );
}
