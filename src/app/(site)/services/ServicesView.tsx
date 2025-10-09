// src/app/(site)/services/ServicesView.tsx
'use client';

import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
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

interface Category {
  id: string;
  name: string;
}

interface Theme {
  id: string;
  name: string;
  categoryId: string;
}

interface Formation {
    id: string;
    themeId: string;
}

interface CategoryWithThemes extends Category {
    themes: Theme[];
    formationCount: number;
}

interface ServicesViewProps {
  pageData: Page | null;
  categories: Category[];
  themes: Theme[];
  formations: Formation[];
}

const ContentSection = ({
    section,
    reverse = false,
    cta,
    children
  }: {
    section: Section;
    reverse?: boolean;
    cta?: React.ReactNode;
    children?: React.ReactNode;
  }) => {
    if (!section || (!section.content && !section.title)) return null;

    return (
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            {section.imageUrl && (
                <div className={`relative aspect-video w-full max-w-md mx-auto md:max-w-none ${reverse ? 'md:col-start-2' : ''}`}>
                    <Image 
                        src={section.imageUrl} 
                        alt={section.title}
                        fill
                        className="object-cover rounded-lg"
                    />
                </div>
            )}
            <div className={`space-y-4 text-center md:text-left ${reverse && section.imageUrl ? 'md:col-start-1 md:row-start-1' : ''} ${!section.imageUrl ? 'col-span-full max-w-3xl mx-auto' : ''}`}>
                <h2 className="text-2xl font-normal tracking-tighter sm:text-3xl font-headline text-primary">{section.title}</h2>
                <p className="text-muted-foreground whitespace-pre-wrap">{section.content}</p>
                {children}
                {cta && <div className="pt-2">{cta}</div>}
            </div>
        </div>
    );
};


export default function ServicesView({ pageData, categories, themes, formations }: ServicesViewProps) {
  const heroSection = pageData?.sections.find(s => s.id === 'hero');
  const trainingSection = pageData?.sections.find(s => s.id === 'executive-training');
  const seminarsSection = pageData?.sections.find(s => s.id === 'corporate-seminars');
  const onlineSection = pageData?.sections.find(s => s.id === 'imeda-online');
  const reachSection = pageData?.sections.find(s => s.id === 'geographic-reach');
  const heroImageUrl = heroSection?.imageUrl;

  const categoriesWithThemes: CategoryWithThemes[] = categories.map(category => {
    const categoryThemes = themes.filter(theme => theme.categoryId === category.id);
    const formationCount = formations.filter(formation => categoryThemes.some(theme => theme.id === formation.themeId)).length;
    return {
      ...category,
      themes: categoryThemes,
      formationCount
    };
  }).filter(c => c.formationCount > 0);

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="container py-8">
        <div className="relative h-[40vh] min-h-[300px] w-full overflow-hidden">
            {!pageData ? (
              <Skeleton className="h-full w-full" />
            ) : (
              heroImageUrl && (
                <Image
                    src={heroImageUrl}
                    alt={heroSection?.title || "Nos Services background"}
                    fill
                    className="object-cover"
                    priority
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
                    {heroSection?.title || "Nos Services"}
                    </h1>
                    <p className="mx-auto mt-4 max-w-[600px] text-sm text-gray-200 md:text-base">
                    {heroSection?.content || "Des solutions sur mesure pour les entreprises, conçues pour la performance et la croissance."}
                    </p>
                </>
                )}
            </div>
        </div>
      </section>
      
      {/* Content Sections */}
      <section className="py-16 md:py-24 bg-muted/30 w-full">
        <div className="container px-4 md:px-6 space-y-16 md:space-y-24">
            {trainingSection && (
                <ContentSection section={trainingSection}>
                     <Accordion type="multiple" className="w-full mt-6">
                        {categoriesWithThemes.map((category) => (
                            <AccordionItem value={category.id} key={category.id}>
                                <AccordionTrigger>
                                    <div className="flex items-center justify-between w-full text-left">
                                        <h3 className="font-headline font-normal text-lg">{category.name}</h3>
                                        <p className="text-sm text-muted-foreground mr-4">{category.formationCount} formations</p>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pl-4">
                                     <div className="grid sm:grid-cols-2 gap-x-8 gap-y-2 pt-2">
                                        {category.themes.map(theme => (
                                            <Button key={theme.id} variant="link" asChild className="h-auto p-2 text-sm text-muted-foreground justify-start hover:text-primary hover:no-underline">
                                                <Link href={`/courses?themeId=${theme.id}`}>{theme.name}</Link>
                                            </Button>
                                        ))}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </ContentSection>
            )}

            {seminarsSection && (
                <ContentSection 
                    section={seminarsSection}
                    reverse={true}
                    cta={
                        <Button asChild>
                            <Link href="/partenariats">Découvrir nos partenariats <ArrowRight className="ml-2 h-4 w-4" /></Link>
                        </Button>
                    }
                />
            )}

            {onlineSection && (
                 <ContentSection 
                    section={onlineSection}
                    cta={
                        <Button asChild>
                            <Link href="#">Explorer Imeda Online <ArrowRight className="ml-2 h-4 w-4" /></Link>
                        </Button>
                    }
                />
            )}

            {reachSection && (
                <ContentSection 
                    section={reachSection}
                />
            )}
        </div>
      </section>
    </div>
  );
}
