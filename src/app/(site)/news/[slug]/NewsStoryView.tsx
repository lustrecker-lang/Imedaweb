// src/app/(site)/news/[slug]/NewsStoryView.tsx
'use client';

import { usePathname } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Share2, Twitter, Facebook, Linkedin, Copy } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEffect, useState } from 'react';

interface NewsStory {
  id: string;
  title: string;
  slug: string;
  publicationDate: string;
  content: string;
  mediaUrl?: string;
}

const isVideoUrl = (url?: string | null) => {
    if (!url) return false;
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov'];
    try {
      const pathname = new URL(url).pathname.split('?')[0];
      return videoExtensions.some(ext => pathname.toLowerCase().endsWith(ext));
    } catch (e) {
      return false; // Invalid URL
    }
};

const ShareButtons = ({ title }: { title: string }) => {
  const { toast } = useToast();
  const [currentUrl, setCurrentUrl] = useState('');
  
  useEffect(() => {
    setCurrentUrl(window.location.href);
  }, []);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl).then(() => {
      toast({ description: "Link copied to clipboard!" });
    }).catch(err => {
      console.error('Failed to copy: ', err);
      toast({ variant: 'destructive', description: "Failed to copy link." });
    });
  };

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(title)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`,
    linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(currentUrl)}&title=${encodeURIComponent(title)}`,
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-muted-foreground">Share:</span>
       <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="h-8 w-8">
            <Share2 className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => window.open(shareLinks.twitter, '_blank')}>
            <Twitter className="mr-2 h-4 w-4" />
            <span>Twitter</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => window.open(shareLinks.facebook, '_blank')}>
            <Facebook className="mr-2 h-4 w-4" />
            <span>Facebook</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => window.open(shareLinks.linkedin, '_blank')}>
            <Linkedin className="mr-2 h-4 w-4" />
            <span>LinkedIn</span>
          </DropdownMenuItem>
           <DropdownMenuItem onSelect={handleCopyLink}>
            <Copy className="mr-2 h-4 w-4" />
            <span>Copy Link</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default function NewsStoryView({ story }: { story: NewsStory }) {
  const isVideo = isVideoUrl(story.mediaUrl);

  return (
    <article className="container mx-auto max-w-7xl px-4 py-12 md:px-6">
      <div className="mb-8">
        <Button variant="ghost" size="sm" asChild>
            <Link href="/news">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to News
            </Link>
        </Button>
      </div>

      <div className="grid md:grid-cols-12 md:gap-12 lg:gap-16">
        <div className="md:col-span-5 lg:col-span-4 mb-8 md:mb-0">
           {story.mediaUrl && (
            <div className="sticky top-24">
                <div className="relative aspect-[9/16] w-full overflow-hidden rounded-lg">
                    {isVideo ? (
                        <video
                            src={story.mediaUrl}
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="absolute inset-0 h-full w-full object-cover"
                        />
                    ) : (
                        <Image
                            src={story.mediaUrl}
                            alt={story.title}
                            fill
                            className="object-cover"
                            priority
                        />
                    )}
                </div>
            </div>
          )}
        </div>
        
        <div className="md:col-span-7 lg:col-span-8">
          <header className="mb-8">
            <h1 className="text-3xl font-normal tracking-tighter sm:text-4xl font-headline text-primary">
              {story.title}
            </h1>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                <p className="text-sm text-muted-foreground">
                Published on {story.publicationDate}
                </p>
                <ShareButtons title={story.title} />
            </div>
          </header>
          
          <div 
            className="prose prose-stone dark:prose-invert max-w-none prose-p:text-base prose-p:leading-relaxed prose-h2:font-headline prose-h2:font-normal prose-h2:text-2xl prose-h2:text-primary"
            dangerouslySetInnerHTML={{ __html: story.content.replace(/\n/g, '<br />') }} 
          />
        </div>
      </div>
    </article>
  );
}
