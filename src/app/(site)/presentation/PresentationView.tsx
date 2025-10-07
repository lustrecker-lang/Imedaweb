// src/app/(site)/presentation/PresentationView.tsx
'use client';

import Image from "next/image";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ContactForm } from "@/components/contact-form";
import { AnimatedProgress } from "@/components/ui/animated-progress";

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

const ContentSection = ({
    section,
    reverse = false,
    cta,
  }: {
    section: Section;
    reverse?: boolean;
    cta?: React.ReactNode;
  }) => (
    <div className={`grid md:grid-cols-2 gap-8 md:gap-12 items-center ${reverse ? 'md:grid-flow-col-dense' : ''}`}>
        <div className={`relative aspect-square w-full max-w-md mx-auto md:max-w-none ${reverse ? 'md:col-start-2' : ''}`}>
            <Image 
                src={section.imageUrl || "https://picsum.photos/seed/placeholder/800/800"} 
                alt={section.title}
                fill
                className="object-cover rounded-lg"
                data-ai-hint="team business meeting"
            />
        </div>
        <div className="space-y-4">
            <h2 className="text-2xl font-normal tracking-tighter sm:text-3xl font-headline text-primary">{section.title}</h2>
            <p className="text-muted-foreground whitespace-pre-wrap">{section.content.split('\n\n[DISTRIBUTION_DATA]')[0]}</p>
            {cta && <div className="pt-2">{cta}</div>}
        </div>
    </div>
);

const ClientDistributionSection = ({ section }: { section: Section }) => {
    let distributionData: Record<string, number> = {};
    const contentParts = section.content.split('\n\n[DISTRIBUTION_DATA]\n');
    const mainContent = contentParts[0];
    
    if (contentParts.length > 1) {
        try {
            distributionData = JSON.parse(contentParts[1]);
        } catch (e) {
            console.error("Failed to parse client distribution data:", e);
        }
    }

    const sortedCountries = Object.entries(distributionData).sort(([, a], [, b]) => b - a);

    return (
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            <div className="relative aspect-square w-full max-w-md mx-auto md:max-w-none">
                <Image 
                    src={section.imageUrl || "https://picsum.photos/seed/clients/800/800"} 
                    alt={section.title}
                    fill
                    className="object-cover rounded-lg"
                    data-ai-hint="map africa"
                />
            </div>
            <div className="space-y-4">
                <h2 className="text-2xl font-normal tracking-tighter sm:text-3xl font-headline text-primary">{section.title}</h2>
                <p className="text-muted-foreground">{mainContent}</p>
                <div className="space-y-4 pt-4">
                    {sortedCountries.map(([country, percentage]) => (
                        <div key={country}>
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-medium text-foreground">{country}</span>
                                <span className="text-sm font-medium text-primary">{percentage}%</span>
                            </div>
                            <AnimatedProgress value={percentage} className="h-2" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};


export default function PresentationView({ pageData }: PresentationViewProps) {
  const [isContactSheetOpen, setIsContactSheetOpen] = useState(false);
  const heroSection = pageData?.sections.find(s => s.id === 'hero');
  const heroImageUrl = heroSection?.imageUrl;
  
  const missionSection = pageData?.sections.find(s => s.id === 'mission');
  const visionSection = pageData?.sections.find(s => s.id === 'vision');
  const clientsSection = pageData?.sections.find(s => s.id === 'clients');
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
                        <div className="flex flex-wrap gap-4 mt-6">
                            <Button asChild>
                                <Link href="/courses">
                                    Nos Formations <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                             <Sheet open={isContactSheetOpen} onOpenChange={setIsContactSheetOpen}>
                                <SheetTrigger asChild>
                                    <Button variant="outline">Contactez-nous</Button>
                                </SheetTrigger>
                                <SheetContent side="right">
                                    <ContactForm onFormSubmit={() => setIsContactSheetOpen(false)} showHeader={true} />
                                </SheetContent>
                            </Sheet>
                        </div>
                    </>
                 ) : (
                    <div className="space-y-4">
                        <Skeleton className="h-12 w-3/4" />
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-6 w-5/6" />
                        <div className="flex gap-4">
                            <Skeleton className="h-10 w-36" />
                            <Skeleton className="h-10 w-36" />
                        </div>
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
          {clientsSection && <ClientDistributionSection section={clientsSection} />}
          {storySection && (
            <ContentSection
              section={storySection}
              reverse
              cta={
                <Sheet open={isContactSheetOpen} onOpenChange={setIsContactSheetOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline">Contactez-nous</Button>
                  </SheetTrigger>
                  <SheetContent side="right">
                    <ContactForm onFormSubmit={() => setIsContactSheetOpen(false)} showHeader={true} />
                  </SheetContent>
                </Sheet>
              }
            />
          )}
          {participantsSection && (
            <ContentSection
              section={participantsSection}
              cta={
                <Button asChild>
                  <Link href="/partenariats">Devenez Partenaire</Link>
                </Button>
              }
            />
          )}
          {impactSection && <ContentSection section={impactSection} reverse />}
        </div>
      </section>
    </div>
  );
}
