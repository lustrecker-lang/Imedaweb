
// src/app/(site)/publications/page.tsx
import { adminDb } from '@/firebase/admin';
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import { Timestamp } from 'firebase-admin/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Publications | IMEDA',
  description: 'Explore our latest articles, research, and insights.',
};

interface Article {
  id: string;
  title: string;
  author: string;
  publicationDate: Timestamp;
  summary?: string;
  imageUrl?: string;
}

async function getArticles() {
  try {
    const articlesSnap = await adminDb.collection('articles').orderBy('publicationDate', 'desc').get();
    const articles = articlesSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Article[];
    return articles;
  } catch (error) {
    console.error("Error fetching articles:", error);
    return [];
  }
}

export default async function PublicationsPage() {
  const articles = await getArticles();

  return (
    <div className="container mx-auto px-4 py-12 md:px-6">
      <header className="mb-12 text-center">
        <h1 className="text-3xl font-normal tracking-tighter sm:text-4xl font-headline">Publications</h1>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
          Explore our latest articles, research, and insights from our experts.
        </p>
      </header>

      {articles.length > 0 ? (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <Card key={article.id} className="flex flex-col overflow-hidden">
              <Link href={`/publications/${article.id}`} className="block group">
                <div className="aspect-video relative overflow-hidden">
                    {article.imageUrl ? (
                        <Image
                            src={article.imageUrl}
                            alt={article.title}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                    ) : (
                        <div className="h-full w-full bg-muted flex items-center justify-center">
                            <p className="text-xs text-muted-foreground">No Image</p>
                        </div>
                    )}
                </div>
              </Link>
              <CardHeader>
                <CardTitle className="font-headline font-normal text-xl leading-tight">
                    <Link href={`/publications/${article.id}`} className="hover:text-primary transition-colors">
                        {article.title}
                    </Link>
                </CardTitle>
                <CardDescription className="text-xs">
                  By {article.author} on {format(article.publicationDate.toDate(), 'PPP')}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground line-clamp-3">{article.summary}</p>
              </CardContent>
              <div className="p-6 pt-0">
                 <Button variant="link" asChild className="p-0 h-auto">
                    <Link href={`/publications/${article.id}`}>
                        Read More <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                 </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-muted-foreground">No articles have been published yet.</p>
        </div>
      )}
    </div>
  );
}
