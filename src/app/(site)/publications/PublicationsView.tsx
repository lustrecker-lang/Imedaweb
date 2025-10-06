// src/app/(site)/publications/PublicationsView.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';


interface Article {
  id: string;
  title: string;
  author: string;
  publicationDate: string;
  summary?: string;
  imageUrl?: string;
  slug?: string;
  topicId?: string;
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

export default function PublicationsView({ articles, pageData, topics }: PublicationsViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const topicIdFromUrl = searchParams.get('topic');

  const [selectedTopic, setSelectedTopic] = useState<string | null>(topicIdFromUrl);

  useEffect(() => {
    setSelectedTopic(topicIdFromUrl);
  }, [topicIdFromUrl]);

  const heroSection = pageData?.sections.find(s => s.id === 'hero');
  const heroImageUrl = heroSection?.imageUrl;

  const filteredArticles = useMemo(() => {
    if (!selectedTopic || selectedTopic === 'all') {
      return articles;
    }
    return articles.filter(article => article.topicId === selectedTopic);
  }, [articles, selectedTopic]);
  
  const handleTopicChange = (topicId: string) => {
    const newTopicId = topicId === 'all' ? null : topicId;
    setSelectedTopic(newTopicId);

    const params = new URLSearchParams(window.location.search);
    if (newTopicId) {
      params.set('topic', newTopicId);
    } else {
      params.delete('topic');
    }
    router.push(`/publications?${params.toString()}`);
  };


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
            <CardContent className="p-0 mt-6 max-w-xs">
                <Select onValueChange={handleTopicChange} value={selectedTopic || 'all'}>
                    <SelectTrigger className="w-full bg-transparent text-white border-white/50 hover:bg-white/10 hover:text-white">
                        <SelectValue placeholder="Filter by topic" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Topics</SelectItem>
                        {topics.map(topic => (
                            <SelectItem key={topic.id} value={topic.id}>{topic.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </CardContent>
          </div>
        </Card>
      </header>
      
      {filteredArticles && filteredArticles.length > 0 ? (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {filteredArticles.map((article) => {
            const topic = topics.find(t => t.id === article.topicId);
            return (
              <Card key={article.id} className="flex flex-col overflow-hidden">
                <Link href={`/publications/${article.slug || article.id}`} className="block group">
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
                  <CardTitle className="font-headline font-normal text-xl leading-tight">
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
      ) : (
        <div className="text-center py-16">
          <p className="text-muted-foreground">No articles found for the selected topic.</p>
        </div>
      )}
    </div>
  );
}

    