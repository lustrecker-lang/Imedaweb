
// src/app/(admin)/admin/seed-catalog-banner/page.tsx
'use client';

import { Button } from '@/components/ui/button';
import { useFirestore, setDocumentNonBlocking, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const catalogSectionData = {
    id: "catalog-download",
    title: "Catalogue 2025-26",
    content: "Entrez votre email pour recevoir notre catalogue complet et découvrir toutes nos formations.",
    imageUrl: "https://picsum.photos/seed/catalog/800/600"
};

export default function SeedCatalogBannerPage() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const homePageRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'pages', 'home');
  }, [firestore]);

  const { data: homePage, isLoading: isPageLoading } = useDoc(homePageRef);

  const handleSeed = () => {
    if (!firestore || !homePage) {
        toast({
            title: "Error",
            description: "Homepage data not loaded yet. Please try again in a moment.",
            variant: "destructive"
        });
        return;
    }

    const sections = homePage.sections || [];
    const existingSectionIndex = sections.findIndex(s => s.id === 'catalog-download');

    let updatedSections;
    if (existingSectionIndex > -1) {
        // Update existing section
        updatedSections = [...sections];
        updatedSections[existingSectionIndex] = { ...updatedSections[existingSectionIndex], ...catalogSectionData };
    } else {
        // Add new section if it doesn't exist
        updatedSections = [...sections, catalogSectionData];
    }
    
    const updatedPageData = { ...homePage, sections: updatedSections };

    setDocumentNonBlocking(homePageRef!, updatedPageData, {});

    toast({
        title: "Seeding Initiated",
        description: "The 'Download Catalog' section on the homepage is being populated with initial content.",
    });
  };

  return (
    <div className="container mx-auto px-4 py-12 md:px-6">
       <Card>
        <CardHeader>
          <CardTitle>Seed 'Download Catalog' Banner</CardTitle>
          <CardDescription>
            Click the button below to populate the 'Download Catalog' section on the homepage.
            If the section already exists, its content will be updated. If not, it will be added.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button onClick={handleSeed} disabled={isPageLoading}>
            {isPageLoading ? 'Loading page data...' : "Seed 'Download Catalog' Content"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
