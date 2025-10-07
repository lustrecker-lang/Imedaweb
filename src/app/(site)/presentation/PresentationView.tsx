// src/app/(site)/presentation/PresentationView.tsx
'use client';

import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";

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
      <section className="container py-8">
        <div className="relative h-[40vh] min-h-[300px] w-full overflow-hidden">
            {!pageData ? (
              <Skeleton className="h-full w-full" />
            ) : (
              heroImageUrl && (
                <Image
                    src={heroImageUrl}
                    alt={heroSection?.title || "Présentation background"}
                    fill
                    className="object-cover"
                    priority
                    data-ai-hint="professional african business"
                />
              )
            )}
            <div className="absolute inset-0 bg-black/50" />
            <div className="relative z-10 flex h-full flex-col items-center justify-center text-center text-white p-4">
                {!pageData ? (
                <div className="w-full max-w-3xl space-y-4">
                    <Skeleton className="h-12 w-3/4 mx-auto bg-gray-400/50" />
                    <Skeleton className="h-6 w-full max-w-2xl mx-auto bg-gray-400/50" />
                </div>
                ) : (
                <>
                    <h1 className="text-2xl font-normal tracking-tighter sm:text-3xl md:text-4xl font-headline text-white">
                    {heroSection?.title || "Présentation"}
                    </h1>
                    <p className="mx-auto mt-4 max-w-[600px] text-sm text-gray-200 md:text-base">
                    {heroSection?.content || "Découvrez qui nous sommes, notre vision et notre engagement envers l'excellence."}
                    </p>
                </>
                )}
            </div>
        </div>
      </section>
      
      <section className="container py-16 md:py-24 space-y-16">
        {missionSection && <ContentSection section={missionSection} />}
        {visionSection && <ContentSection section={visionSection} reverse />}
        {storySection && <ContentSection section={storySection} />}
        {participantsSection && <ContentSection section={participantsSection} reverse />}
        {impactSection && <ContentSection section={impactSection} />}
      </section>
    </div>
  );
}
