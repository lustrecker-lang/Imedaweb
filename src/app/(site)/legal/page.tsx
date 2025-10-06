
// src/app/(site)/legal/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

interface Section {
  id: string;
  title: string;
  content: string;
}

interface Page {
  id: string;
  title: string;
  sections: Section[];
}

export default function LegalPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const firestore = useFirestore();
  const [activeTab, setActiveTab] = useState("terms");

  const pageRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'pages', 'legal');
  }, [firestore]);

  const { data: legalPage, isLoading: isPageLoading } = useDoc<Page>(pageRef);

  useEffect(() => {
    const hash = window.location.hash.substring(1);
    if (hash === 'privacy' || hash === 'branding' || hash === 'terms') {
      setActiveTab(hash);
    }
  }, []);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    router.replace(`/legal#${value}`, { scroll: false });
  };
  
  const navItems = legalPage?.sections || [
      { id: 'terms', title: 'Conditions d’utilisation' },
      { id: 'privacy', title: 'Politique de confidentialité' },
      { id: 'branding', title: 'Protection des marques' },
  ];

  const activeContent = legalPage?.sections.find(s => s.id === activeTab);

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
                {isPageLoading ? (
                    <div className="space-y-2">
                        <Skeleton className="h-9 w-full" />
                        <Skeleton className="h-9 w-full" />
                        <Skeleton className="h-9 w-full" />
                    </div>
                ) : (
                    navItems.map((item) => (
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
                    ))
                )}
            </nav>
        </aside>

        <main className="md:col-span-3">
          {isPageLoading ? (
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-1/2" />
                    <Skeleton className="h-4 w-1/4 mt-2" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                </CardContent>
            </Card>
          ) : activeContent ? (
            <Card>
              <CardHeader>
                <CardTitle className="font-headline text-2xl font-normal">{activeContent.title}</CardTitle>
                <CardDescription>Dernière mise à jour : 24 Juillet 2024</CardDescription>
              </CardHeader>
              <CardContent 
                className="prose prose-sm prose-p:text-muted-foreground prose-h2:font-headline prose-h2:font-normal prose-h2:text-foreground dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: activeContent.content }}
              />
            </Card>
          ) : (
             <p className="text-muted-foreground">Contenu non disponible.</p>
          )}
        </main>
      </div>
    </div>
  );
}
