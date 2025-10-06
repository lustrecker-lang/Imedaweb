

// src/app/(site)/publications/PublicationsView.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Pagination, PaginationContent, PaginationItem } from '@/components/ui/pagination';


interface Article {
  id: string;
  title: string;
  author: string;
  publicationDate: string;
  summary?: string;
  imageUrl?: string;
  slug?: string;
  topicId?: string;
  topic?: { id: string; name: string };
  sections?: {
      id: string;
      title?: string;
      paragraph?: string;
      imageUrl?: string;
  }[];
}

interface Topic {
    id: string;
    name: string;
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

interface PublicationsViewProps {
  articles: Article[];
  pageData: Page | null;
  topics: Topic[];
}

const ARTICLES_PER_PAGE = 8;

export default function PublicationsView({ articles, pageData, topics }: PublicationsViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const topicIdFromUrl = searchParams.get('topic');
  const pageFromUrl = searchParams.get('page');

  const [selectedTopic, setSelectedTopic] = useState<string | null>(topicIdFromUrl);
  const [currentPage, setCurrentPage] = useState(pageFromUrl ? parseInt(pageFromUrl, 10) : 1);
  
  useEffect(() => {
    setSelectedTopic(topicIdFromUrl);
    setCurrentPage(pageFromUrl ? parseInt(pageFromUrl, 10) : 1);
  }, [topicIdFromUrl, pageFromUrl]);

  const heroSection = pageData?.sections.find(s => s.id === 'hero');
  const heroImageUrl = heroSection?.imageUrl;

  const activeTopics = useMemo(() => {
    const articleTopicIds = new Set(articles.map(a => a.topicId));
    return topics.filter(t => articleTopicIds.has(t.id));
  }, [articles, topics]);

  const filteredArticles = useMemo(() => {
    if (!selectedTopic || selectedTopic === 'all') {
      return articles;
    }
    return articles.filter(article => article.topicId === selectedTopic);
  }, [articles, selectedTopic]);

  const totalPages = Math.ceil(filteredArticles.length / ARTICLES_PER_PAGE);
  
  const paginatedArticles = useMemo(() => {
      const startIndex = (currentPage - 1) * ARTICLES_PER_PAGE;
      const endIndex = startIndex + ARTICLES_PER_PAGE;
      return filteredArticles.slice(startIndex, endIndex);
  }, [filteredArticles, currentPage]);

  const handleTopicChange = (topicId: string | null) => {
    setSelectedTopic(topicId);
    setCurrentPage(1); // Reset to first page on filter change

    const params = new URLSearchParams();
    if (topicId) {
      params.set('topic', topicId);
    }
    router.push(`/publications?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    const params = new URLSearchParams(window.location.search);
    if (newPage > 1) {
      params.set('page', newPage.toString());
    } else {
      params.delete('page');
    }
    router.push(`/publications?${params.toString()}`);
  }

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
              <CardTitle className="text-3xl font-normal tracking-tighter sm:text-4xl font-headline">
                {heroSection?.title || 'Publications'}
              </CardTitle>
              <CardDescription className="mt-2 max-w-2xl text-gray-200">
                {heroSection?.content || 'Explore our latest articles, research, and insights from our experts.'}
              </CardDescription>
            </CardHeader>
          </div>
        </Card>
      </header>

      <div className="mb-10">
        <div className="flex overflow-x-auto space-x-2 pb-4 md:flex-wrap md:overflow-x-visible md:pb-0 md:space-x-0 md:gap-2">
            <Button 
              variant={!selectedTopic || selectedTopic === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleTopicChange(null)}
              className="shrink-0"
            >
              All Topics
            </Button>
            {activeTopics.map(topic => (
                <Button
                  key={topic.id}
                  variant={selectedTopic === topic.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleTopicChange(topic.id)}
                  className="shrink-0"
                >
                  {topic.name}
                </Button>
            ))}
        </div>
      </div>
      
      {paginatedArticles && paginatedArticles.length > 0 ? (
        <>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {paginatedArticles.map((article) => {
              const topic = topics.find(t => t.id === article.topicId);
              return (
                <Card key={article.id} className="flex flex-col overflow-hidden group">
                  <Link href={`/publications/${article.slug || article.id}`} className="block">
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
                    {topic && <Badge variant="secondary" className="w-fit mb-2">{topic.name}</Badge>}
                    <CardTitle className="font-headline font-normal text-lg leading-tight">
                        <Link href={`/publications/${article.slug || article.id}`} className="hover:text-primary transition-colors">
                            {article.title}
                        </Link>
                    </CardTitle>
                    <CardDescription className="text-xs">
                      By {article.author} on {article.publicationDate}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="text-sm text-muted-foreground line-clamp-3">{article.summary}</p>
                  </CardContent>
                  <div className="p-6 pt-0">
                     <Button variant="link" asChild className="p-0 h-auto">
                        <Link href={`/publications/${article.slug || article.id}`}>
                            Read More <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                     </Button>
                  </div>
                </Card>
              );
            })}
          </div>

          {totalPages > 1 && (
            <Pagination className="mt-12">
                <PaginationContent>
                    <PaginationItem>
                        <Button
                            variant="outline"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Previous
                        </Button>
                    </PaginationItem>
                    <PaginationItem className="hidden sm:block">
                        <span className="text-sm text-muted-foreground">
                            Page {currentPage} of {totalPages}
                        </span>
                    </PaginationItem>
                    <PaginationItem>
                         <Button
                            variant="outline"
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                        >
                            Next
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </PaginationItem>
                </PaginationContent>
            </Pagination>
          )}
        </>
      ) : (
        <div className="text-center py-16">
          <p className="text-muted-foreground">No articles found for the selected topic.</p>
        </div>
      )}
    </div>
  );
}
