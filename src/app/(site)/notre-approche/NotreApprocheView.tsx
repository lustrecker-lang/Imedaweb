
// src/app/(site)/notre-approche/NotreApprocheView.tsx
'use client';

import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, BrainCircuit } from "lucide-react";
import { useState } from 'react';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ContactForm } from "@/components/contact-form";
import { cn } from "@/lib/utils";


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

interface NotreApprocheViewProps {
  pageData: Page | null;
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

const MediaPreview = ({ url, alt, className }: { url: string; alt: string; className?: string }) => {
    if (isVideoUrl(url)) {
        return (
            <video src={url} autoPlay loop muted playsInline className={cn("absolute inset-0 h-full w-full object-cover", className)}/>
        );
    }
    return (
        <Image src={url} alt={alt} fill className={cn("object-cover", className)} />
    );
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
  <div className={`grid md:grid-cols-2 gap-8 md:gap-12 items-center`}>
    <div className={`relative aspect-square w-full max-w-md mx-auto md:max-w-none ${reverse ? 'md:col-start-2' : ''}`}>
      {section.imageUrl && <MediaPreview url={section.imageUrl} alt={section.title} className="rounded-lg" />}
    </div>
    <div className={`space-y-4 text-center md:text-left ${reverse ? 'md:col-start-1 md:row-start-1' : ''}`}>
      <h2 className="text-2xl font-normal tracking-tighter sm:text-3xl font-headline text-primary">{section.title}</h2>
      <p className="text-muted-foreground whitespace-pre-wrap">{section.content.split('\n\n[DISTRIBUTION_DATA]')[0]}</p>
      {cta && <div className="pt-2">{cta}</div>}
    </div>
  </div>
);


export default function NotreApprocheView({ pageData }: NotreApprocheViewProps) {
  const [isContactSheetOpen, setIsContactSheetOpen] = useState(false);
  
  const heroSection = pageData?.sections.find(s => s.id === 'hero');
  const heroImageUrl = heroSection?.imageUrl;

  const introSection = pageData?.sections.find(s => s.id === 'intro');
  const groundedSection = pageData?.sections.find(s => s.id === 'grounded');
  const experienceSection = pageData?.sections.find(s => s.id === 'experience');
  const tailoredSection = pageData?.sections.find(s => s.id === 'tailored');
  const insightSection = pageData?.sections.find(s => s.id === 'insight');
  const impactSection = pageData?.sections.find(s => s.id === 'impact');

  return (
    <div className="flex flex-col">
      <section className="container py-8">
        <div className="relative h-[40vh] min-h-[300px] w-full overflow-hidden">
            {!pageData ? (
              <Skeleton className="h-full w-full" />
            ) : (
              heroImageUrl && (
                <MediaPreview url={heroImageUrl} alt={heroSection?.title || "Notre Approche background"} />
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
                    {heroSection?.title || "Notre Approche"}
                    </h1>
                    <p className="mx-auto mt-4 max-w-[600px] text-sm text-gray-200 md:text-base">
                    {heroSection?.content || "Découvrez la méthodologie unique qui guide notre excellence."}
                    </p>
                </>
                )}
            </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container px-4 md:px-6">
            {introSection && (
                <div className="text-center max-w-3xl mx-auto">
                    <p className="mt-6 text-lg text-muted-foreground md:text-xl">{introSection.content}</p>
                </div>
            )}
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container px-4 md:px-6 space-y-16 md:space-y-24">
            {groundedSection && <ContentSection 
                section={groundedSection}
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
            />}
            {experienceSection && <ContentSection 
                section={experienceSection} 
                reverse={true}
                cta={
                    <Button asChild>
                        <Link href="/courses">Explorer nos formations <ArrowRight className="ml-2 h-4 w-4" /></Link>
                    </Button>
                }
            />}
            {tailoredSection && <ContentSection 
                section={tailoredSection}
                cta={
                    <Button asChild>
                        <Link href="/partenariats">Découvrir nos partenariats <ArrowRight className="ml-2 h-4 w-4" /></Link>
                    </Button>
                }
            />}
            {insightSection && <ContentSection section={insightSection} reverse={true} />}
            {impactSection && <ContentSection section={impactSection} />}
        </div>
      </section>

    </div>
  );
}
