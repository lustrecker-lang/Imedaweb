
'use client';

import { Button } from '@/components/ui/button';
import { useFirestore, setDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const pagesToSeed = [
    {
        id: "home",
        title: "Home Page",
        sections: [
            {
                id: "hero",
                title: "Innovate. Manage. Excel.",
                content: "IMEDA provides the tools you need to elevate your business operations to the next level."
            },
            {
                id: "features",
                title: "Features Designed for Growth",
                content: "Our platform is packed with powerful features to help you succeed."
            },
            {
                id: "feature-1",
                title: "Streamlined Workflow",
                content: "Experience unparalleled efficiency with our intuitive and powerful platform, designed to simplify complex tasks."
            },
            {
                id: "feature-2",
                title: "Insightful Analytics",
                content: "Gain a competitive edge with real-time data and comprehensive analytics that drive informed decision-making."
            },
            {
                id: "feature-3",
                title: "Collaborative Environment",
                content: "Foster teamwork and innovation with collaborative tools that connect your team, wherever they are."
            }
        ]
    },
    {
        id: "about",
        title: "About Page",
        sections: [
            {
                id: "hero",
                title: "About Our Company",
                content: "We are a team of passionate individuals dedicated to creating the best solutions for our customers."
            }
        ]
    }
];

const campusesToSeed = [
    { 
        name: "Dubaï", 
        slug: "dubai", 
        description: "Our campus in the heart of a global hub for innovation and business.",
        hero: { title: "Welcome to our Dubaï Campus" },
        campusDescription: { headline: "Experience Excellence in Dubaï", body: "Our state-of-the-art campus in Dubaï offers a vibrant and multicultural learning environment." },
        faq: { headline: "Frequently Asked Questions", faqs: [{id: '1', question: 'What programs are offered?', answer: 'We offer a wide range of business and technology programs.'}] }
    },
    { 
        name: "Côte d’Azur", 
        slug: "cote-dazur", 
        description: "Study in a vibrant location on the French Riviera.",
        hero: { title: "Study at Côte d’Azur" },
        campusDescription: { headline: "Innovation on the French Riviera", body: "Enjoy a unique blend of high-quality education and a stunning Mediterranean lifestyle." },
    },
    { 
        name: "Paris", 
        slug: "paris", 
        description: "Experience education in one of the world's most iconic cities.",
        hero: { title: "Learn in the Heart of Paris" },
        campusDescription: { headline: "A Parisian Education", body: "Immerse yourself in the culture and history of Paris while receiving a world-class education." },
    },
];

const servicesToSeed = [
  { "name": "Hébergement", "description": "Des établissements soigneusement sélectionnés offrant tout le confort essentiel pour un séjour agréable." },
  { "name": "Petits-déjeuners", "description": "Options de petit-déjeuner adaptées pour bien commencer la journée de formation." },
  { "name": "Salle de Formation", "description": "Espaces dédiés, équipés pour offrir un cadre optimal à l’apprentissage et aux échanges." },
  { "name": "Déjeuners", "description": "Un repas complet, savoureux et bien présenté, pour une pause agréable dans un cadre simple et chaleureux." },
  { "name": "Ordinateur ou Tablet", "description": "Matériel informatique fourni pour faciliter l’accès aux ressources numériques et optimiser l’expérience d’apprentissage." },
  { "name": "Chauffeur privé", "description": "Transport quotidien assuré par un chauffeur privé pour les trajets aller-retour entre l’hébergement et le lieu de formation." },
  { "name": "Certificat IMEDA", "description": "Certificat personnalisé avec mention du programme suivi et des modules validés, accompagné d’un rapport d’évaluation." },
  { "name": "Transfers privés aéroport", "description": "Accueil et transport privé depuis l’aéroport, assuré par un chauffeur professionnel dans un véhicule confortable." },
  { "name": "Sortie Touristique", "description": "Une visite guidée des lieux emblématiques, pour découvrir l’essentiel de la ville en toute simplicité et convivialité." },
  { "name": "Dîner et Soirée de Clôture", "description": "Une soirée conviviale pour célébrer la fin du programme et partager un moment chaleureux entre participants." },
  { "name": "Carte Transport Publique", "description": "Accès illimité aux transports en commun dans toutes les zones urbaines pendant le séjour complet." },
  { "name": "Petite restauration Formation", "description": "Offres de restauration légère conçues pour accompagner les pauses durant la formation." },
  { "name": "Matériel pédagogique", "description": "Ensemble d’articles fournis pour accompagner les participants tout au long de la formation." },
  { "name": "Accès aux réseau professionnel", "description": "Inscription au répertoire des anciens participants et accès à la newsletter institutionnelle." },
  { "name": "Concierge 24/7", "description": "Un service d’assistance disponible à tout moment pour répondre aux besoins logistiques, pratiques ou personnels." },
  { "name": "Kit de bienvenue", "description": "Ensemble d’articles sélectionnés pour accueillir les participants et faciliter l’intégration au programme." }
];

export default function SeedPage() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleSeed = () => {
    if (!firestore) return;

    pagesToSeed.forEach(page => {
        const pageRef = doc(firestore, 'pages', page.id);
        setDocumentNonBlocking(pageRef, page, {});
    });

    const campusCollection = collection(firestore, 'campuses');
    campusesToSeed.forEach(campus => {
        addDocumentNonBlocking(campusCollection, campus);
    });

    toast({
        title: "Seeding Initiated",
        description: "Your database is being populated with initial content for pages and campuses.",
    });
  };

  const handleSeedServices = () => {
    if (!firestore) return;
    
    const servicesCollection = collection(firestore, 'services');
    servicesToSeed.forEach(service => {
        addDocumentNonBlocking(servicesCollection, service);
    });
    
    toast({
        title: "Service Seeding Initiated",
        description: "Your 'services' collection is being populated.",
    });
  }

  return (
    <div className="container mx-auto px-4 py-12 md:px-6">
       <Card>
        <CardHeader>
          <CardTitle>Database Seeding</CardTitle>
          <CardDescription>
            Click the buttons below to populate your Firestore database with initial content.
            This is a one-time action for each data type.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button onClick={handleSeed}>Seed Pages & Campuses</Button>
          <Button onClick={handleSeedServices} variant="secondary">Seed Services</Button>
        </CardContent>
      </Card>
    </div>
  );
}
