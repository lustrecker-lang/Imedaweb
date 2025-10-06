
// src/app/(admin)/admin/seed-legal/page.tsx
'use client';

import { Button } from '@/components/ui/button';
import { useFirestore, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const pageToSeed = {
    id: "legal",
    title: "Legal Page",
    sections: [
        {
            id: "terms",
            title: "Conditions d’utilisation",
            content: `
              <h2 class="text-base font-semibold">1. Objet</h2>
              <p>Les présentes conditions générales d'utilisation (dites « CGU ») ont pour objet l'encadrement juridique des modalités de mise à disposition du site et des services par IMEDA et de définir les conditions d’accès et d’utilisation des services par « l'Utilisateur ».</p>

              <h2 class="text-base font-semibold">2. Accès au site</h2>
              <p>Le site est accessible gratuitement en tout lieu à tout Utilisateur ayant un accès à Internet. Tous les frais supportés par l'Utilisateur pour accéder au service (matériel informatique, logiciels, connexion Internet, etc.) sont à sa charge.</p>

              <h2 class="text-base font-semibold">3. Propriété intellectuelle</h2>
              <p>Les marques, logos, signes ainsi que tous les contenus du site (textes, images, son…) font l'objet d'une protection par le Code de la propriété intellectuelle et plus particulièrement par le droit d'auteur. L'Utilisateur doit solliciter l'autorisation préalable du site pour toute reproduction, publication, copie des différents contenus.</p>
            `
        },
        {
            id: "privacy",
            title: "Politique de confidentialité",
            content: `
              <h2 class="text-base font-semibold">1. Collecte des données personnelles</h2>
              <p>Nous collectons les données suivantes : nom, prénom, adresse électronique, numéro de téléphone. Ces données sont collectées lorsque vous remplissez nos formulaires de contact ou d'inscription.</p>

              <h2 class="text-base font-semibold">2. Utilisation des données</h2>
              <p>Les données collectées sont utilisées pour la gestion de la relation client, la fourniture de nos services et l'envoi d'informations commerciales si vous y avez consenti. Elles ne sont jamais transmises à des tiers non autorisés.</p>

              <h2 class="text-base font-semibold">3. Vos droits</h2>
              <p>Conformément à la réglementation, vous disposez d’un droit d’accès, de rectification, de portabilité et d’effacement de vos données ou encore de limitation du traitement. Vous pouvez également, pour des motifs légitimes, vous opposer au traitement des données vous concernant.</p>
            `
        },
        {
            id: "branding",
            title: "Protection des marques",
            content: `
              <h2 class="text-base font-semibold">1. Utilisation des marques IMEDA</h2>
              <p>Le nom IMEDA, notre logo et tous les noms de produits et services, slogans et graphismes associés sont des marques déposées de IMEDA International. Toute utilisation non autorisée est strictement interdite et peut faire l'objet de poursuites judiciaires.</p>

              <h2 class="text-base font-semibold">2. Directives générales</h2>
              <p>Vous ne pouvez pas utiliser les marques IMEDA d'une manière qui pourrait laisser entendre une affiliation, un parrainage ou une approbation de votre produit ou service par IMEDA sans notre autorisation écrite préalable.</p>
              
              <h2 class="text-base font-semibold">3. Contact</h2>
              <p>Pour toute demande d'utilisation de nos marques ou pour signaler une utilisation abusive, veuillez nous contacter via notre page de contact.</p>
            `
        }
    ]
};

export default function SeedLegalPage() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleSeed = () => {
    if (!firestore) return;

    const pageRef = doc(firestore, 'pages', pageToSeed.id);
    setDocumentNonBlocking(pageRef, pageToSeed, {});

    toast({
        title: "Seeding Initiated",
        description: "Your database is being populated with initial content for the 'Legal' page.",
    });
  };

  return (
    <div className="container mx-auto px-4 py-12 md:px-6">
       <Card>
        <CardHeader>
          <CardTitle>Legal Page Seeding</CardTitle>
          <CardDescription>
            Click the button below to populate your Firestore database with initial content for the Legal page.
            If content already exists for 'pages/legal', it will be overwritten.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button onClick={handleSeed}>Seed 'Legal' Page Content</Button>
        </CardContent>
      </Card>
    </div>
  );
}
