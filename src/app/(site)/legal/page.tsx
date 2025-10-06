// src/app/(site)/legal/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export default function LegalPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("terms");

  useEffect(() => {
    // This effect runs on the client after the component mounts
    const hash = window.location.hash.substring(1);
    if (hash === 'privacy' || hash === 'branding' || hash === 'terms') {
      setActiveTab(hash);
    }
  }, []);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Update URL hash without reloading the page
    router.replace(`/legal#${value}`, { scroll: false });
  };
  
  const navItems = [
      { id: 'terms', title: 'Conditions d’utilisation' },
      { id: 'privacy', title: 'Politique de confidentialité' },
      { id: 'branding', title: 'Protection des marques' },
  ];

  return (
    <div className="container mx-auto max-w-7xl px-4 py-12 md:px-6">
      <header className="mb-12 text-left">
        <h1 className="text-3xl font-normal tracking-tighter sm:text-4xl font-headline">Mentions Légales</h1>
        <p className="text-muted-foreground mt-2 text-base">
          Informations importantes concernant l'utilisation de nos services.
        </p>
      </header>

      <div className="grid md:grid-cols-4 gap-8 lg:gap-12">
        <aside className="md:col-span-1">
            <nav className="flex flex-col space-y-2 sticky top-24">
                {navItems.map((item) => (
                    <Button
                        key={item.id}
                        variant="ghost"
                        onClick={() => handleTabChange(item.id)}
                        className={cn(
                            "justify-start text-left",
                            activeTab === item.id && "bg-muted font-semibold text-primary"
                        )}
                    >
                        {item.title}
                    </Button>
                ))}
            </nav>
        </aside>

        <main className="md:col-span-3">
          {activeTab === 'terms' && (
            <Card>
              <CardHeader>
                <CardTitle className="font-headline text-2xl font-normal">Conditions Générales d’Utilisation</CardTitle>
                <CardDescription>Dernière mise à jour : 24 Juillet 2024</CardDescription>
              </CardHeader>
              <CardContent className="prose prose-sm prose-p:text-muted-foreground prose-h2:text-foreground dark:prose-invert max-w-none">
                <h2 className="text-base font-semibold">1. Objet</h2>
                <p>Les présentes conditions générales d'utilisation (dites « CGU ») ont pour objet l'encadrement juridique des modalités de mise à disposition du site et des services par IMEDA et de définir les conditions d’accès et d’utilisation des services par « l'Utilisateur ».</p>

                <h2 className="text-base font-semibold">2. Accès au site</h2>
                <p>Le site est accessible gratuitement en tout lieu à tout Utilisateur ayant un accès à Internet. Tous les frais supportés par l'Utilisateur pour accéder au service (matériel informatique, logiciels, connexion Internet, etc.) sont à sa charge.</p>

                <h2 className="text-base font-semibold">3. Propriété intellectuelle</h2>
                <p>Les marques, logos, signes ainsi que tous les contenus du site (textes, images, son…) font l'objet d'une protection par le Code de la propriété intellectuelle et plus particulièrement par le droit d'auteur. L'Utilisateur doit solliciter l'autorisation préalable du site pour toute reproduction, publication, copie des différents contenus.</p>
              </CardContent>
            </Card>
          )}

          {activeTab === 'privacy' && (
            <Card>
              <CardHeader>
                <CardTitle className="font-headline text-2xl font-normal">Politique de Confidentialité</CardTitle>
                <CardDescription>Dernière mise à jour : 24 Juillet 2024</CardDescription>
              </CardHeader>
              <CardContent className="prose prose-sm prose-p:text-muted-foreground prose-h2:text-foreground dark:prose-invert max-w-none">
                <h2 className="text-base font-semibold">1. Collecte des données personnelles</h2>
                <p>Nous collectons les données suivantes : nom, prénom, adresse électronique, numéro de téléphone. Ces données sont collectées lorsque vous remplissez nos formulaires de contact ou d'inscription.</p>

                <h2 className="text-base font-semibold">2. Utilisation des données</h2>
                <p>Les données collectées sont utilisées pour la gestion de la relation client, la fourniture de nos services et l'envoi d'informations commerciales si vous y avez consenti. Elles ne sont jamais transmises à des tiers non autorisés.</p>

                <h2 className="text-base font-semibold">3. Vos droits</h2>
                <p>Conformément à la réglementation, vous disposez d’un droit d’accès, de rectification, de portabilité et d’effacement de vos données ou encore de limitation du traitement. Vous pouvez également, pour des motifs légitimes, vous opposer au traitement des données vous concernant.</p>
              </CardContent>
            </Card>
          )}

          {activeTab === 'branding' && (
            <Card>
              <CardHeader>
                <CardTitle className="font-headline text-2xl font-normal">Protection de Nos Marques</CardTitle>
                <CardDescription>Dernière mise à jour : 24 Juillet 2024</CardDescription>
              </CardHeader>
              <CardContent className="prose prose-sm prose-p:text-muted-foreground prose-h2:text-foreground dark:prose-invert max-w-none">
                <h2 className="text-base font-semibold">1. Utilisation des marques IMEDA</h2>
                <p>Le nom IMEDA, notre logo et tous les noms de produits et services, slogans et graphismes associés sont des marques déposées de IMEDA International. Toute utilisation non autorisée est strictement interdite et peut faire l'objet de poursuites judiciaires.</p>

                <h2 className="text-base font-semibold">2. Directives générales</h2>
                <p>Vous ne pouvez pas utiliser les marques IMEDA d'une manière qui pourrait laisser entendre une affiliation, un parrainage ou une approbation de votre produit ou service par IMEDA sans notre autorisation écrite préalable.</p>
                
                <h2 className="text-base font-semibold">3. Contact</h2>
                <p>Pour toute demande d'utilisation de nos marques ou pour signaler une utilisation abusive, veuillez nous contacter via notre page de contact.</p>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}
