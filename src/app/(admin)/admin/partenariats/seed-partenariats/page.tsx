// src/app/(admin)/admin/partenariats/seed-partenariats/page.tsx
'use client';

import { Button } from '@/components/ui/button';
import { useFirestore, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const pageToSeed = {
    id: "partenariats",
    title: "Partenariats d'entreprise",
    sections: [
        {
            id: "hero",
            title: "Partenariats d'entreprise",
            content: "Collaborez avec nous pour créer des solutions innovantes et atteindre un succès mutuel.",
            imageUrl: "https://picsum.photos/seed/partnerships-hero/1200/400"
        },
        {
            id: "why-us-header",
            title: "Pourquoi Nous Choisir ?",
            content: "Nous combinons une expertise académique de pointe avec une compréhension approfondie des réalités du terrain pour offrir des solutions qui génèrent un impact réel et durable.",
            imageUrl: null
        },
        {
            id: "why-us-1",
            title: "Approche Sur-Mesure",
            content: "Chaque partenariat est unique. Nous co-créons des programmes qui répondent précisément à vos objectifs stratégiques.",
            imageUrl: "https://picsum.photos/seed/why-us-1/800/800"
        },
        {
            id: "why-us-2",
            title: "Excellence Pédagogique",
            content: "Nos intervenants sont des experts reconnus, alliant rigueur académique et expérience pratique de haut niveau.",
            imageUrl: "https://picsum.photos/seed/why-us-2/800/800"
        },
        {
            id: "why-us-3",
            title: "Réseau Panafricain",
            content: "Bénéficiez de notre vaste réseau sur le continent pour des perspectives enrichies et des opportunités de collaboration étendues.",
            imageUrl: "https://picsum.photos/seed/why-us-3/800/800"
        },
        {
            id: "why-us-4",
            title: "Impact Mesurable",
            content: "Nous nous engageons sur des résultats tangibles, avec des outils de suivi et d'évaluation pour mesurer la performance de nos interventions.",
            imageUrl: "https://picsum.photos/seed/why-us-4/800/800"
        },
        {
            id: "specialisations-header",
            title: "Nos domaines de spécialisation",
            content: "Notre expertise couvre un large éventail de secteurs clés pour le développement et la performance des organisations.",
            imageUrl: null
        },
        {
            id: "spec-1", title: "Leadership et Management Stratégique", content: "Développer la vision et les compétences des dirigeants pour naviguer la complexité.", imageUrl: null
        },
        {
            id: "spec-2", title: "Transformation Digitale", content: "Accompagner les organisations dans l'adoption des nouvelles technologies.", imageUrl: null
        },
        {
            id: "spec-3", title: "Finance et Gouvernance", content: "Renforcer la performance financière et les pratiques de bonne gouvernance.", imageUrl: null
        },
        {
            id: "spec-4", title: "Gestion de Projets et Programmes", content: "Piloter des projets complexes avec des méthodologies éprouvées (PMI, PRINCE2).", imageUrl: null
        },
        {
            id: "spec-5", title: "Développement Durable et RSE", content: "Intégrer les enjeux environnementaux et sociaux dans la stratégie d'entreprise.", imageUrl: null
        },
        {
            id: "spec-6", title: "Excellence Opérationnelle", content: "Optimiser les processus et la chaîne de valeur pour une meilleure efficacité.", imageUrl: null
        },
        {
            id: "spec-7", title: "Politiques Publiques et Réformes", content: "Accompagner les institutions publiques dans la conception et la mise en œuvre des réformes.", imageUrl: null
        },
        {
            id: "spec-8", title: "Marketing et Développement Commercial", content: "Adapter les stratégies marketing et commerciales aux nouveaux enjeux du marché.", imageUrl: null
        },
        {
            id: "how-we-work-header",
            title: "Comment nous travaillons avec vous",
            content: "Notre approche collaborative se déroule en quatre étapes clés, garantissant un alignement parfait avec vos besoins.",
            imageUrl: null
        },
        {
            id: "step-1", title: "Découvrir", content: "Immersion dans votre contexte, analyse de vos enjeux et définition commune des objectifs.", imageUrl: null
        },
        {
            id: "step-2", title: "Concevoir", content: "Co-conception d'une solution sur-mesure, définition des livrables et des indicateurs de succès.", imageUrl: null
        },
        {
            id: "step-3", title: "Développer", content: "Mise en œuvre du programme avec nos experts, en mode projet agile et collaboratif.", imageUrl: null
        },
        {
            id: "step-4", title: "Livrer", content: "Déploiement, évaluation de l'impact et planification des prochaines étapes pour pérenniser les acquis.", imageUrl: null
        },
        {
            id: "format-1",
            title: "Séminaires Intra-Entreprise",
            content: "Des formations exclusives pour vos équipes, adaptées à votre culture et à vos défis.",
            imageUrl: "https://picsum.photos/seed/format-1/800/600"
        },
        {
            id: "format-2",
            title: "Learning Expeditions",
            content: "Des voyages d'études immersifs pour s'inspirer des meilleures pratiques internationales.",
            imageUrl: "https://picsum.photos/seed/format-2/800/600"
        },
        {
            id: "format-3",
            title: "Conseil et Accompagnement",
            content: "Nos experts vous accompagnent sur des missions de conseil stratégique et opérationnel.",
            imageUrl: "https://picsum.photos/seed/format-3/800/600"
        },
        {
            id: "catalog-download",
            title: "Intéressé par une collaboration sur mesure ?",
            content: "Téléchargez notre catalogue corporate pour découvrir l'étendue de notre offre pour les entreprises et institutions.",
            imageUrl: "https://picsum.photos/seed/partnerships-catalog/800/600"
        }
    ]
};

export default function SeedPartnershipsPage() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleSeed = () => {
    if (!firestore) return;

    const pageRef = doc(firestore, 'pages', pageToSeed.id);
    setDocumentNonBlocking(pageRef, pageToSeed, {});

    toast({
        title: "Seeding Initiated",
        description: "Your database is being populated with content for the 'Partenariats' page.",
    });
  };

  return (
    <div className="container mx-auto px-4 py-12 md:px-6">
       <Card>
        <CardHeader>
          <CardTitle>Partenariats Page Seeding</CardTitle>
          <CardDescription>
            Click the button below to populate your Firestore database with the new content sections for the 'Partenariats' page.
            This will overwrite any existing content for this page.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button onClick={handleSeed}>Seed 'Partenariats' Page Content</Button>
        </CardContent>
      </Card>
    </div>
  );
}
