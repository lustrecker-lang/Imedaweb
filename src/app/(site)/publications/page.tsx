
// src/app/(site)/publications/page.tsx
'use client';

import { adminDb } from '@/firebase/admin';
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import { Timestamp } from 'firebase-admin/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, orderBy, where } from 'firebase/firestore';
import { useMemo, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';

interface Article {
  id: string;
  title: string;
  author: string;
  publicationDate: Timestamp;
  summary?: string;
  imageUrl?: string;
}

interface Section {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
}

interface Page {
  id: string;
  title: string;
  sections: Section[];
}

export default function PublicationsPage() {
  const firestore = useFirestore();
  const [selectedAuthor, setSelectedAuthor] = useState<string | 'all'>('all');

  const pageRef = useMemoFirebase(() => firestore ? doc(firestore, 'pages', 'publications') : null, [firestore]);
  const { data: pageData, isLoading: isPageLoading } = useDoc<Page>(pageRef);

  const articlesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    const baseQuery = query(collection(firestore, 'articles'), orderBy('publicationDate', 'desc'));
    if (selectedAuthor && selectedAuthor !== 'all') {
      return query(baseQuery, where('author', '==', selectedAuthor));
    }
    return baseQuery;
  }, [firestore, selectedAuthor]);

  const { data: articles, isLoading: areArticlesLoading } = useCollection<Article>(articlesQuery);
  const { data: allArticles } = useCollection<Article>(useMemoFirebase(() => firestore ? query(collection(firestore, 'articles')) : null, [firestore]));

  const authors = useMemo(() => {
    if (!allArticles) return [];
    const uniqueAuthors = new Set(allArticles.map(a => a.author));
    return Array.from(uniqueAuthors).sort();
  }, [allArticles]);
  
  const heroSection = pageData?.sections.find(s => s.id === 'hero');
  const heroImageUrl = heroSection?.imageUrl;

  return (
    <div className="container mx-auto px-4 py-12 md:px-6">
      <header className="mb-12">
        <Card className="relative w-full overflow-hidden md:min-h-[250px] flex flex-col justify-center text-left">
          {heroImageUrl && (
            <Image
              src={heroImageUrl}
              alt={heroSection?.title || 'Publications background'}
              fill
              className="object-cover"
            />
          )}
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative z-10 p-6 sm:p-8 md:p-10 text-white">
            <CardHeader className="p-0">
              {isPageLoading ? (
                <>
                  <Skeleton className="h-10 w-3/4 bg-gray-400/50" />
                  <Skeleton className="h-5 w-1/2 mt-3 bg-gray-400/50" />
                </>
              ) : (
                <>
                  <CardTitle className="text-3xl font-normal tracking-tighter sm:text-4xl font-headline">
                    {heroSection?.title || 'Publications'}
                  </CardTitle>
                  <CardDescription className="mt-2 max-w-2xl text-gray-200">
                    {heroSection?.content || 'Explore our latest articles, research, and insights from our experts.'}
                  </CardDescription>
                </>
              )}
            </CardHeader>
            <CardContent className="p-0 mt-6">
               <div className="w-full max-w-[240px]">
                    <Label className="text-sm font-medium text-gray-300 mb-2 block">Topics</Label>
                    <Select value={selectedAuthor} onValueChange={setSelectedAuthor}>
                        <SelectTrigger className="bg-transparent text-white border-white/50 hover:bg-white/10 hover:text-white">
                            <SelectValue placeholder="Filter by author..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Authors</SelectItem>
                            {authors.map(author => (
                                <SelectItem key={author} value={author}>{author}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                 </div>
            </CardContent>
          </div>
        </Card>
      </header>

      {areArticlesLoading ? (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({length: 6}).map((_, i) => (
                <Card key={i} className="animate-pulse">
                    <div className="aspect-video bg-muted rounded-t-lg"></div>
                    <CardHeader><div className="h-6 w-3/4 bg-muted rounded-md"></div><div className="h-4 w-1/2 bg-muted rounded-md mt-2"></div></CardHeader>
                    <CardContent><div className="h-12 w-full bg-muted rounded-md"></div></CardContent>
                    <div className="p-6 pt-0"><div className="h-5 w-24 bg-muted rounded-md"></div></div>
                </Card>
            ))}
        </div>
      ) : articles && articles.length > 0 ? (
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
                  By {article.author} on {article.publicationDate ? format(article.publicationDate.toDate(), 'PPP') : ''}
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
          <p className="text-muted-foreground">No articles found for the selected topic.</p>
        </div>
      )}
    </div>
  );
}
