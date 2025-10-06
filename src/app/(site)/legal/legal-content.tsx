'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
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

interface LegalContentProps {
  initialData: Page | null;
}

export function LegalContent({ initialData }: LegalContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("terms");
  const [legalPage, setLegalPage] = useState(initialData);
  const [isPageLoading, setIsPageLoading] = useState(initialData === null);

  useEffect(() => {
    // This is the client-only logic
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
    <div className="grid md:grid-cols-4 gap-8 lg:gap-12">
      <aside className="md:col-span-1">
          <nav className="flex flex-col space-y-1 sticky top-24">
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
                              "justify-start text-left text-muted-foreground",
                              activeTab === item.id && "font-semibold text-foreground border border-border shadow-sm bg-background hover:bg-background"
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
  );
}