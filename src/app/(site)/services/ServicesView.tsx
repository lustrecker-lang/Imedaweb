// src/app/(site)/services/ServicesView.tsx
'use client';

import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useMemo, useEffect } from 'react';
import { ArrowRight, Search, Loader2, ChevronsUpDown } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ContactForm } from "@/components/contact-form";
import { Combobox } from "@/components/ui/combobox";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

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
                <div className={`relative aspect-square w-full max-w-md mx-auto md:max-w-none ${reverse ? 'md:col-start-2' : ''}`}>
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
  const [isContactSheetOpen, setIsContactSheetOpen] = useState(false);
  const heroSection = pageData?.sections.find(s => s.id === 'hero');
  const trainingSection = pageData?.sections.find(s => s.id === 'executive-training');
  const seminarsSection = pageData?.sections.find(s => s.id === 'corporate-seminars');
  const onlineSection = pageData?.sections.find(s => s.id === 'imeda-online');
  const reachSection = pageData?.sections.find(s => s.id === 'geographic-reach');
  const heroImageUrl = heroSection?.imageUrl;

  const [isMobile, setIsMobile] = useState(false);
  const [isThemeSheetOpen, setIsThemeSheetOpen] = useState(false);
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkIsMobile = () => setIsMobile(window.innerWidth < 768);
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  const themeOptions = useMemo(() => themes.map(theme => ({ value: theme.id, label: theme.name })), [themes]);

  const handleSearch = () => {
    if (selectedThemeId) {
      setIsSearching(true);
      router.push(`/courses?themeId=${selectedThemeId}`);
    } else if (isMobile) {
        setIsThemeSheetOpen(true);
    }
  };

  const handleMobileThemeSelect = (themeId: string) => {
    setSelectedThemeId(themeId);
    setIsThemeSheetOpen(false);
  };
  
  const categoriesWithThemes = useMemo(() => {
    return categories.map(category => {
      const categoryThemes = themes.filter(theme => theme.categoryId === category.id);
      return {
        ...category,
        themes: categoryThemes
      };
    }).filter(c => c.themes.length > 0);
  }, [categories, themes]);

  const MobileThemeSearch = () => (
    <Sheet open={isThemeSheetOpen} onOpenChange={setIsThemeSheetOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between"
          onClick={() => setIsThemeSheetOpen(true)}
        >
          <span className="truncate">
            {selectedThemeId
              ? themeOptions.find(t => t.value === selectedThemeId)?.label
              : "Rechercher un thème..."}
          </span>
          <ChevronsUpDown className="h-4 w-4 opacity-50 shrink-0" />
        </Button>
      </SheetTrigger>
  
      <SheetContent side="bottom" className="h-[70vh] flex flex-col p-0 bg-white">
        <SheetHeader className="p-6 pb-2">
          <SheetTitle className="font-headline text-2xl font-normal text-left">
            Sélectionner un thème
          </SheetTitle>
        </SheetHeader>
  
        <div className="flex-grow overflow-y-auto px-6">
          <Accordion
            type="multiple"
            defaultValue={categoriesWithThemes.map(category => category.id)}
            className="w-full"
          >
            {categoriesWithThemes.map(category => (
              <AccordionItem
                key={category.id}
                value={category.id}
              >
                <AccordionTrigger className="py-3 text-primary/80 transition-colors hover:text-primary hover:no-underline font-headline font-normal text-lg">
                  {category.name}
                </AccordionTrigger>
                <AccordionContent className="pl-4">
                  <div className="flex flex-col items-start pt-2">
                    {category.themes.map(theme => (
                      <Button
                        key={theme.id}
                        variant="link"
                        className="h-auto p-2 text-sm text-primary/90 text-left justify-start hover:no-underline"
                        onClick={() => handleMobileThemeSelect(theme.id)}
                      >
                        {theme.name}
                      </Button>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </SheetContent>
    </Sheet>
  );

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
                    <div className="mt-6 w-full max-w-2xl mx-auto md:mx-0">
                        <div className="flex flex-col sm:flex-row items-center gap-2 p-3 rounded-lg">
                           {isMobile ? (
                            <MobileThemeSearch />
                        ) : (
                            <Combobox
                                items={themeOptions}
                                value={selectedThemeId}
                                onChange={setSelectedThemeId}
                                placeholder="Rechercher un thème de formation..."
                                searchPlaceholder="Rechercher un thème..."
                                noResultsText="Aucun thème trouvé."
                            />
                        )}
                        <Button onClick={handleSearch} className="w-full sm:w-auto" disabled={isSearching || (!selectedThemeId && !isMobile) }>
                          {isSearching ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Recherche...
                            </>
                          ) : (
                            <>
                              <Search className="mr-2 h-4 w-4" />
                              Rechercher
                            </>
                          )}
                        </Button>
                        </div>
                    </div>
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
