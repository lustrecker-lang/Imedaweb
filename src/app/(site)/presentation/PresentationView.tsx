// src/app/(site)/presentation/PresentationView.tsx
'use client';

import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

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

interface PresentationViewProps {
  pageData: Page | null;
}

const ContentSection = ({ section, reverse = false }: { section: Section, reverse?: boolean}) => (
    <div className={`grid md:grid-cols-2 gap-8 md:gap-12 items-center ${reverse ? 'md:grid-flow-col-dense' : ''}`}>
        <div className={`relative aspect-video w-full h-64 md:h-full ${reverse ? 'md:col-start-2' : ''}`}>
            <Image 
                src={section.imageUrl || "https://picsum.photos/seed/placeholder/800/600"} 
                alt={section.title}
                fill
                className="object-cover rounded-lg"
                data-ai-hint="team business meeting"
            />
        </div>
        <div className="space-y-4">
            <h2 className="text-2xl font-normal tracking-tighter sm:text-3xl font-headline text-primary">{section.title}</h2>
            <p className="text-muted-foreground whitespace-pre-wrap">{section.content}</p>
        </div>
    </div>
);

export default function PresentationView({ pageData }: PresentationViewProps) {
  const heroSection = pageData?.sections.find(s => s.id === 'hero');
  const heroImageUrl = heroSection?.imageUrl;
  
  const missionSection = pageData?.sections.find(s => s.id === 'mission');
  const visionSection = pageData?.sections.find(s => s.id === 'vision');
  const storySection = pageData?.sections.find(s => s.id === 'story');
  const participantsSection = pageData?.sections.find(s => s.id === 'participants');
  const impactSection = pageData?.sections.find(s => s.id === 'impact');

  return (
    <div className="flex flex-col">
       <section className="container py-12 md:py-20">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            <div>
                 {pageData ? (
                    <>
                        <h1 className="text-3xl font-normal tracking-tighter sm:text-4xl md:text-5xl font-headline">
                            {heroSection?.title || "Présentation"}
                        </h1>
                        <p className="mt-4 max-w-[600px] text-muted-foreground md:text-lg">
                           {heroSection?.content || "Découvrez qui nous sommes, notre vision et notre engagement envers l'excellence."}
                        </p>
                        <Button asChild className="mt-6">
                            <Link href="/courses">
                                Our Courses <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </>
                 ) : (
                    <div className="space-y-4">
                        <Skeleton className="h-12 w-3/4" />
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-6 w-5/6" />
                        <Skeleton className="h-10 w-36 mt-4" />
                    </div>
                 )}
            </div>
            <div className="relative aspect-video w-full h-80 md:h-full">
                {pageData ? (
                    heroImageUrl && (
                        <Image
                            src={heroImageUrl}
                            alt={heroSection?.title || "Présentation background"}
                            fill
                            className="object-cover rounded-lg"
                            priority
                            data-ai-hint="professional african leadership"
                        />
                    )
                ) : (
                    <Skeleton className="h-full w-full rounded-lg" />
                )}
            </div>
        </div>
      </section>
      
      <section className="container py-16 md:py-24 space-y-16 bg-muted/30 -mx-4 w-full max-w-full">
        <div className="max-w-7xl mx-auto px-4 md:px-6 space-y-16">
          {missionSection && <ContentSection section={missionSection} />}
          {visionSection && <ContentSection section={visionSection} reverse />}
          {storySection && <ContentSection section={storySection} />}
          {participantsSection && <ContentSection section={participantsSection} reverse />}
          {impactSection && <ContentSection section={impactSection} />}
        </div>
      </section>
    </div>
  );
}
