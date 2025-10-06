// src/app/(site)/publications/PublicationDetailView.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Section {
  id: string;
  title?: string;
  paragraph?: string;
  imageUrl?: string;
}

interface Topic {
  id: string;
  name: string;
}

interface Article {
  id: string;
  title: string;
  slug: string;
  author: string;
  publicationDate: string;
  summary?: string;
  sections?: Section[];
  imageUrl?: string;
  topicId?: string;
  topic: Topic | null;
}

interface PublicationDetailViewProps {
    article: Article;
}

export default function PublicationDetailView({ article }: PublicationDetailViewProps) {
  return (
    <article className="container mx-auto max-w-4xl px-4 py-12 md:px-6">
      <div className="mb-8">
        <Button variant="ghost" size="sm" asChild>
            <Link href="/publications">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Publications
            </Link>
        </Button>
      </div>
      
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-normal tracking-tighter sm:text-4xl font-headline text-primary">
          {article.title}
        </h1>
        <div className="mt-4 text-sm text-muted-foreground flex items-center justify-center gap-4">
          <span>By {article.author}</span>
          <span>&bull;</span>
          <span>{article.publicationDate}</span>
          {article.topic && (
            <>
                <span>&bull;</span>
                <Link href={`/publications?topic=${article.topic.id}`} className="hover:text-primary">{article.topic.name}</Link>
            </>
          )}
        </div>
      </header>
      
      {article.imageUrl && (
        <div className="relative aspect-video w-full overflow-hidden rounded-lg mb-12">
          <Image
            src={article.imageUrl}
            alt={article.title}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}
      
      <div className="prose prose-stone mx-auto max-w-3xl dark:prose-invert prose-p:text-base prose-p:leading-relaxed prose-h2:font-headline prose-h2:font-normal prose-h2:text-2xl prose-h2:text-primary">
        {article.sections && article.sections.map(section => (
            <section key={section.id} className="mb-8">
                {section.title && <h2>{section.title}</h2>}
                {section.imageUrl && (
                    <div className="relative aspect-video w-full overflow-hidden rounded-lg my-6">
                        <Image src={section.imageUrl} alt={section.title || article.title} fill className="object-cover" />
                    </div>
                )}
                {section.paragraph && <div dangerouslySetInnerHTML={{ __html: section.paragraph.replace(/\n/g, '<br />') }} />}
            </section>
        ))}
      </div>

    </article>
  );
}
