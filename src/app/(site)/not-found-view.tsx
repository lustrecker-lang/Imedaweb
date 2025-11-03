
'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';

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

interface NotFoundViewProps {
  pageData: Page;
}

export default function NotFoundView({ pageData }: NotFoundViewProps) {
  const mainContent = pageData.sections.find(s => s.id === 'main');

  return (
    <div className="container mx-auto flex h-[calc(100vh-16rem)] min-h-[400px] items-center justify-center px-4 text-center md:px-6">
      <div className="space-y-4">
        <h1 className="text-9xl font-bold tracking-tighter text-primary/10">404</h1>
        <div className="space-y-2">
          <h2 className="text-3xl font-normal tracking-tight font-headline">{mainContent?.title || "Page introuvable"}</h2>
          <p className="text-muted-foreground">{mainContent?.content || "Désolé, la page que vous recherchez n'existe pas ou a été déplacée."}</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center mt-8">
          <Button asChild>
            <Link href="/">Retour à l'accueil</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/courses">Voir les formations</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
