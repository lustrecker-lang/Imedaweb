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
        },
        {
            id: "executive-training",
            title: "Executive Training Programs",
            content: "Parcourez nos programmes de formation inter-entreprises, conçus pour développer les compétences stratégiques de vos cadres et dirigeants.",
            imageUrl: "" // No image needed for this section
        },
        {
            id: "corporate-seminars",
            title: "Tailored Corporate Seminars",
            content: "Nous concevons des séminaires sur mesure pour répondre aux défis spécifiques de votre organisation. Nos programmes intra-entreprises sont élaborés en collaboration avec vos équipes pour garantir un impact maximal et un alignement parfait avec votre stratégie.",
            imageUrl: "https://picsum.photos/seed/corp-seminars/800/600"
        },
        {
            id: "imeda-online",
            title: "Imeda Online for Business",
            content: "Accédez à notre expertise où que vous soyez. Notre plateforme en ligne offre des parcours de formation flexibles et des ressources de pointe pour le développement continu de vos équipes, combinant la rigueur académique et la commodité du digital.",
            imageUrl: "https://picsum.photos/seed/imeda-online/800/600"
        },
        {
            id: "geographic-reach",
            title: "Geographic Reach",
            content: "Notre institut rayonne à travers le monde avec des campus stratégiquement situés et une offre digitale sans frontières, nous permettant d'accompagner les leaders où qu'ils se trouvent.",
            imageUrl: "https://picsum.photos/seed/geo-reach/1200/500"
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
            Click the button below to populate your Firestore database with the new content sections for the 'Services' page.
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
