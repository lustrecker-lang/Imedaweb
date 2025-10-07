
// src/app/(site)/home-client.tsx
'use client';

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, ArrowRight, Download, CheckCircle, Loader2, ChevronRight, X } from "lucide-react";
import { useState, useMemo, useEffect } from 'react';
import { z } from 'zod';
import { useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Combobox } from "@/components/ui/combobox";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";


// Interfaces
interface Section { id: string; title: string; content: string; imageUrl?: string; }
interface Page { id: string; title: string; sections: Section[]; }
interface Campus { id: string; name: string; slug: string; description?: string; imageUrl?: string; }
interface Category { id: string; name: string; description?: string; mediaUrl?: string; }
interface Theme { id: string; name: string; description?: string; categoryId: string; }
interface Formation { id: string; themeId: string; }
interface Reference { id: string; name: string; logoUrl: string; }
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
}
interface NewsStory {
  id: string;
  title: string;
  slug: string;
  publicationDate: string;
  mediaUrl?: string;
}
interface CompanyProfile {
  name?: string;
  logoUrl?: string;
  logoLightUrl?: string;
  iconUrl?: string;
}


// Props
interface HomeClientProps {
  heroData: Page | null;
  referencesData: Reference[];
  featuresData: Page | null;
  catalogData: Page | null;
  coursesData: { categories: Category[]; themes: Theme[]; formations: Formation[] };
  campusesData: Campus[];
  articlesData: Article[];
  newsData: NewsStory[];
  companyProfile: CompanyProfile | null;
}

const isVideoUrl = (url?: string | null) => {
    if (!url) return false;
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov'];
    try {
      const pathname = new URL(url).pathname.split('?')[0];
      return videoExtensions.some(ext => pathname.toLowerCase().endsWith(ext));
    } catch (e) { return false; }
};

// Component for a campus card
const CampusCardDisplay = ({ campus, className }: { campus: Campus, className?: string }) => {
    const isCardVideo = isVideoUrl(campus.imageUrl);
    return (
        <Link href={`/campus/${campus.slug}`} className={`group relative block overflow-hidden rounded-lg ${className}`}>
        {isCardVideo ? (
             <video src={campus.imageUrl} autoPlay loop muted playsInline className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"/>
        ) : (
            <Image src={campus.imageUrl || `https://picsum.photos/seed/${campus.id}/800/600`} alt={campus.name} fill className="object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"/>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/0" />
        <div className="relative flex h-full flex-col justify-end p-6">
            <h3 className="text-lg font-normal text-white font-headline">{campus.name}</h3>
            {campus.description && (<p className="text-xs text-white/80 mt-1 line-clamp-2">{campus.description}</p>)}
        </div>
        </Link>
    );
  };


export function HomeClient({ heroData, referencesData, featuresData, catalogData, coursesData, campusesData, articlesData, newsData, companyProfile }: HomeClientProps) {
  const router = useRouter();
  const firestore = useFirestore();
  const [isMobile, setIsMobile] = useState(false);
  const [isThemeSheetOpen, setIsThemeSheetOpen] = useState(false);
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);
  const [catalogEmail, setCatalogEmail] = useState('');
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isSearching, setIsSearching] = useState(false);


  useEffect(() => {
    const emailSchema = z.string().email();
    const result = emailSchema.safeParse(catalogEmail);
    setIsEmailValid(result.success);
  }, [catalogEmail]);

  useEffect(() => {
    const checkIsMobile = () => setIsMobile(window.innerWidth < 768);
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  const heroSection = heroData?.sections.find(s => s.id === 'hero');
  const featuresSectionHeader = featuresData?.sections.find(s => s.id === 'features');
  const catalogSection = catalogData?.sections.find(s => s.id === 'catalog-download');
  const heroMediaUrl = heroSection?.imageUrl;
  const isHeroVideo = heroMediaUrl ? isVideoUrl(heroMediaUrl) : false;
  
  const featureSections = useMemo(() => {
    if (!featuresData) return [];
    const sections = [];
    for (let i = 1; i <= 3; i++) {
        const section = featuresData?.sections.find(s => s.id === `feature-${i}`);
        if (section) sections.push(section);
    }
    return sections;
  }, [featuresData]);

  const themeOptions = useMemo(() => coursesData.themes.map(theme => ({ value: theme.id, label: theme.name })), [coursesData.themes]);

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

  const handleCatalogSubmit = async () => {
    if (!isEmailValid || isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (firestore) {
        await addDocumentNonBlocking(collection(firestore, 'leads'), {
            email: catalogEmail,
            leadType: 'Catalog Download',
            fullName: 'Catalog Lead',
            message: 'Catalog Download Request from homepage.',
            createdAt: serverTimestamp(),
        });
      }
      
      const link = document.createElement('a');
      link.href = '/api/download-catalog';
      link.download = 'IMEDA-Catalogue-2025-26.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setHasSubmitted(true);
    } catch (error) {
      console.error("Error submitting lead:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setHasSubmitted(false);
    setCatalogEmail('');
  };

  const categoriesWithThemes = useMemo(() => {
    return coursesData.categories.map(category => {
      const categoryThemes = coursesData.themes.filter(theme => theme.categoryId === category.id);
      const formationCount = coursesData.formations.filter(formation => categoryThemes.some(theme => theme.id === formation.themeId)).length;
      return {
        ...category,
        themes: categoryThemes,
        formationCount: formationCount
      };
    });
  }, [coursesData.categories, coursesData.themes, coursesData.formations]);

  const MobileThemeSearch = () => (
    <Sheet open={isThemeSheetOpen} onOpenChange={setIsThemeSheetOpen}>
        <SheetTrigger asChild>
             <Button variant="outline" className="w-full justify-between bg-white/10 text-white border-white/50 hover:bg-white/20 hover:text-white" onClick={() => setIsThemeSheetOpen(true)}>
                <span className="truncate">
                    {selectedThemeId ? themeOptions.find(t => t.value === selectedThemeId)?.label : "Rechercher un thème..."}
                </span>
                <ChevronRight className="h-4 w-4 opacity-50 shrink-0" />
            </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[70vh] flex flex-col p-0 bg-white">
            <SheetHeader className="p-6 pb-2 flex-row items-center justify-between">
                <SheetTitle className="font-headline text-2xl font-normal text-left">Sélectionner un thème</SheetTitle>
                 <SheetClose asChild>
                  <Button variant="ghost" size="icon">
                    <X className="h-6 w-6" />
                    <span className="sr-only">Close menu</span>
                  </Button>
                </SheetClose>
            </SheetHeader>
            <div className="flex-grow overflow-y-auto px-6">
                <Accordion type="multiple" className="w-full">
                    {categoriesWithThemes.map(category => (
                        <AccordionItem key={category.id} value={category.id} className="border-b last-of-type:border-b-0">
                            <AccordionTrigger className="py-4 text-primary/80 transition-colors hover:text-primary hover:no-underline font-headline font-normal text-xl">
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
      {/* 1. Hero */}
      <section className="py-8">
        <div className="container px-4 md:px-6">
          <div className="relative h-[50vh] min-h-[400px] w-full overflow-hidden">
              {heroMediaUrl && ( isHeroVideo ? 
                  (<video src={heroMediaUrl} autoPlay loop muted playsInline className="absolute inset-0 h-full w-full object-cover"/>) : 
                  (<Image src={heroMediaUrl} alt={heroSection?.title || ""} fill className="object-cover" priority/>)
              )}
              <div className="absolute inset-0 bg-black/50" />
              <div className="relative z-10 flex h-full flex-col items-center justify-center text-center text-white p-4">
                  {companyProfile?.logoLightUrl && (
                    <div className="mb-4 relative h-10 w-48">
                        <Image
                            src={companyProfile.logoLightUrl}
                            alt={companyProfile.name || 'Company Logo'}
                            fill
                            className="object-contain"
                        />
                    </div>
                  )}
                  <h1 className="text-2xl font-normal tracking-tighter sm:text-3xl md:text-4xl font-headline text-white">{heroSection?.title}</h1>
                  <p className="mx-auto mt-4 max-w-[600px] text-sm text-gray-200 md:text-base">{heroSection?.content}</p>
                  <div className="mt-8 w-full max-w-2xl">
                    <div className="flex flex-col sm:flex-row items-center gap-2 bg-white/20 backdrop-blur-sm p-3 rounded-lg border border-white/30">
                        {isMobile ? (
                            <MobileThemeSearch />
                        ) : (
                            <Combobox
                                items={themeOptions}
                                value={selectedThemeId}
                                onChange={setSelectedThemeId}
                                placeholder="Rechercher un thème..."
                                searchPlaceholder="Rechercher un thème..."
                                noResultsText="Aucun thème trouvé."
                                className="bg-transparent text-white border-white/50 placeholder:text-gray-200 hover:bg-white/10 hover:text-white"
                            />
                        )}
                        <Button onClick={handleSearch} className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90" disabled={isSearching || (!selectedThemeId && !isMobile) }>
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
              </div>
          </div>
        </div>
      </section>

      {/* 2. Reference Carousel */}
      {referencesData && referencesData.length > 0 && (
        <section className="py-8 bg-background">
            <div className="container">
                <div className="relative w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,white_10%,white_90%,transparent)]">
                    <div className="flex w-max animate-scroll">
                    {[...referencesData, ...referencesData].map((reference, index) => (
                        <div key={`${reference.id}-${index}`} className="flex items-center justify-center h-20 w-48 px-8">
                        <Image
                            src={reference.logoUrl}
                            alt={reference.name}
                            width={120}
                            height={40}
                            className="max-h-10 w-auto object-contain"
                        />
                        </div>
                    ))}
                    </div>
                </div>
            </div>
        </section>
      )}

      {/* 3. Formations IMEDA Carousel */}
      <section className="py-16">
        <div className="container px-4 md:px-6">
          <div className="flex items-center justify-between mb-8">
            <div className="max-w-[75%]">
                <h2 className="text-xl font-normal tracking-tighter sm:text-2xl font-headline">Formations IMEDA</h2>
                <p className="mt-2 text-sm text-muted-foreground md:text-base/relaxed">
                  <span className="md:hidden">Explorez nos thèmes de formation</span>
                  <span className="hidden md:inline">Explorez nos thèmes de formation pour trouver le programme parfait pour vous.</span>
                </p>
            </div>
          </div>
          <Carousel opts={{ align: "start", loop: false }} className="w-full relative">
          <CarouselContent className="-ml-4">
            {categoriesWithThemes.map((category) => {
                const cardContent = (
                    <Card className="h-full flex flex-col transition-colors overflow-hidden">
                        <div className="aspect-video relative w-full">
                          <Image 
                            src={category.mediaUrl || `https://picsum.photos/seed/${category.id}/400/225`}
                            alt={category.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <CardHeader className="text-left">
                            <CardTitle className="font-headline font-normal">{category.name}</CardTitle>
                             <CardDescription className="text-primary">{`${category.formationCount} formations`}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow text-left">
                            <ul className="text-sm text-muted-foreground space-y-1">
                                {category.themes.map(theme => (
                                    <li key={theme.id} className="truncate">
                                      {isMobile ? theme.name : (
                                        <Link href={`/courses?themeId=${theme.id}`} className="hover:text-primary hover:underline">{theme.name}</Link>
                                      )}
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                );

                return (
                  <CarouselItem key={category.id} className="pl-4 basis-4/5 md:basis-1/2 lg:basis-1/4">
                    {isMobile ? (
                      <Link href={`/courses?categoryId=${category.id}`} className="block h-full">
                        {cardContent}
                      </Link>
                    ) : (
                      <div className="h-full">
                        {cardContent}
                      </div>
                    )}
                  </CarouselItem>
                );
            })}
          </CarouselContent>
            <div className="absolute top-[-3.5rem] right-0 flex gap-2">
              <CarouselPrevious className="static translate-y-0 rounded-none sm:inline-flex" />
              <CarouselNext className="static translate-y-0 rounded-none sm:inline-flex" />
            </div>
          </Carousel>
           <div className="text-left mt-8">
              <Button asChild variant="outline">
                  <Link href="/courses">Voir toutes les formations</Link>
              </Button>
          </div>
        </div>
      </section>

      {/* 4. Catalog Download */}
      {catalogSection && (
        <section className="py-16">
          <div className="container">
            <Card className="overflow-hidden md:rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 items-center">
                    <div className="relative aspect-video h-full min-h-[250px] md:min-h-0 order-1 md:order-2">
                        {catalogSection.imageUrl && (
                            <Image
                                src={catalogSection.imageUrl}
                                alt={catalogSection.title || "Download Catalog"}
                                fill
                                className="object-cover"
                            />
                        )}
                    </div>
                    <div className="p-6 md:p-10 text-left order-2 md:order-1">
                        {hasSubmitted ? (
                          <div className="flex flex-col items-center justify-center text-center space-y-4">
                            <CheckCircle className="w-12 h-12 text-green-500 mb-2" />
                            <h3 className="font-headline font-normal text-2xl">Merci!</h3>
                            <p className="text-muted-foreground mt-1 text-sm">Votre téléchargement a commencé.</p>
                            <Button variant="outline" onClick={handleResetForm} className="mt-4">
                                Fermer
                            </Button>
                          </div>
                        ) : (
                          <>
                            <h3 className="font-headline font-normal text-2xl">{catalogSection.title}</h3>
                            <p className="text-muted-foreground mt-2 text-sm">{catalogSection.content}</p>
                            <div className="flex flex-col sm:flex-row items-center gap-2 mt-6">
                                <Input
                                    type="email"
                                    placeholder="Votre adresse email"
                                    className="w-full sm:flex-1"
                                    value={catalogEmail}
                                    onChange={(e) => setCatalogEmail(e.target.value)}
                                    disabled={isSubmitting}
                                />
                                <Button className="w-full sm:w-auto" disabled={!isEmailValid || isSubmitting} onClick={handleCatalogSubmit}>
                                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                                    Télécharger
                                </Button>
                            </div>
                          </>
                        )}
                    </div>
                </div>
            </Card>
          </div>
        </section>
      )}

      {/* 5. Excellence Academic (Features) */}
      <section className="py-16">
        <div className="container px-4 md:px-6">
          <div className="max-w-2xl">
            <h2 className="text-xl font-normal tracking-tighter sm:text-2xl font-headline">{featuresSectionHeader?.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground md:text-base/relaxed">{featuresSectionHeader?.content}</p>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {featureSections.map((featureSection) => (
                <div key={featureSection.id} className="flex items-start gap-4 md:flex-col md:overflow-hidden md:rounded-lg md:border md:bg-card md:transition-transform md:duration-300 md:ease-in-out md:hover:-translate-y-2">
                    <div className="relative aspect-square w-24 shrink-0 overflow-hidden rounded-lg md:aspect-video md:w-full">
                      {featureSection.imageUrl && (<Image src={featureSection.imageUrl} alt={featureSection.title} fill className="object-cover"/>)}
                    </div>
                    <div className="flex-1 md:p-6 md:pt-4">
                        <h3 className="font-headline font-normal md:text-lg">{featureSection.title}</h3>
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-3">{featureSection.content}</p>
                    </div>
                </div>
              ))}
          </div>
        </div>
      </section>

      {/* 6. Our Campuses */}
      <section className="py-16">
        <div className="container px-4 md:px-6">
          <div className="flex items-center justify-between mb-8">
            <div className="max-w-[75%]">
                <h2 className="text-xl font-normal tracking-tighter sm:text-2xl font-headline">Our Campuses</h2>
                <p className="mt-2 text-sm text-muted-foreground md:text-base/relaxed">
                    <span className="md:hidden">Explore our world-class campuses</span>
                    <span className="hidden md:inline">Explore our world-class campuses located in global hubs of innovation.</span>
                </p>
            </div>
          </div>
          {isMobile ? (
             <Carousel className="w-full relative" opts={{ align: "start", loop: true }}>
                <CarouselContent className="-ml-4">
                  {campusesData.map((campus) => (
                    <CarouselItem key={campus.id} className="basis-4/5 pl-4">
                      <div className="h-[40vh] min-h-[350px] w-full">
                        <CampusCardDisplay campus={campus} className="h-full w-full" />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <div className="absolute top-[-3.5rem] right-0 flex gap-2">
                  <CarouselPrevious className="static translate-y-0 rounded-none" /><CarouselNext className="static translate-y-0 rounded-none" />
                </div>
            </Carousel>
          ) : (
            <div className="mt-12 grid h-[50vh] min-h-[400px] grid-cols-1 grid-rows-3 gap-6 md:grid-cols-2 md:grid-rows-2">
              {campusesData.map((campus, index) => (<CampusCardDisplay key={campus.id} campus={campus} className={index === 0 ? 'md:row-span-2' : ''} />))}
            </div>
          )}
        </div>
      </section>
      
      {/* 7. KPI Numbers */}
      <section className="py-16">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-y-8 md:gap-x-8 text-left">
            <div>
              <p className="text-4xl lg:text-5xl font-headline text-primary"><AnimatedCounter to={700} />+</p>
              <p className="mt-2 font-normal">Formations Internationales</p>
              <p className="text-sm text-muted-foreground">Disponibles dans nos campus et en ligne.</p>
            </div>
            <div>
              <p className="text-4xl lg:text-5xl font-headline text-primary"><AnimatedCounter to={95} />%</p>
              <p className="mt-2 font-normal">Taux de placement</p>
              <p className="text-sm text-muted-foreground">De nos diplômés dans les 6 mois.</p>
            </div>
            <div>
              <p className="text-4xl lg:text-5xl font-headline text-primary"><AnimatedCounter to={120} />+</p>
              <p className="mt-2 font-normal">Nationalités</p>
              <p className="text-sm text-muted-foreground">Représentées parmi nos étudiants.</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* 8. Nos Publications */}
      <section className="py-16 bg-muted/30">
        <div className="container px-4 md:px-6">
          <div className="flex items-center justify-between mb-8">
            <div className="max-w-[75%]">
                <h2 className="text-xl font-normal tracking-tighter sm:text-2xl font-headline">Nos Publications</h2>
                <p className="mt-2 text-sm text-muted-foreground md:text-base/relaxed">
                  Découvrez nos dernières analyses, recherches et perspectives de nos experts.
                </p>
            </div>
          </div>
          <Carousel opts={{ align: "start", loop: false }} className="w-full relative">
            <CarouselContent className="-ml-4">
              {articlesData.map((article) => (
                <CarouselItem key={article.id} className="pl-4 basis-4/5 md:basis-1/2 lg:basis-1/4">
                  <Card className="h-full flex flex-col group overflow-hidden">
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
                      {article.topic && <Badge variant="secondary" className="w-fit mb-2">{article.topic.name}</Badge>}
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
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
             <div className="absolute top-[-3.5rem] right-0 flex gap-2">
              <CarouselPrevious className="static translate-y-0 rounded-none sm:inline-flex" />
              <CarouselNext className="static translate-y-0 rounded-none sm:inline-flex" />
            </div>
          </Carousel>
           <div className="text-left mt-8">
                <Button asChild variant="outline">
                    <Link href="/publications">Voir toutes les publications</Link>
                </Button>
            </div>
        </div>
      </section>

      {/* 9. IMEDA News */}
      <section className="py-16">
        <div className="container px-4 md:px-6">
          <div className="flex items-center justify-between mb-8">
            <div className="max-w-[75%]">
                <h2 className="text-xl font-normal tracking-tighter sm:text-2xl font-headline">IMEDA News</h2>
                <p className="mt-2 text-sm text-muted-foreground md:text-base/relaxed">
                  The latest news and announcements from our institution.
                </p>
            </div>
          </div>
          <Carousel opts={{ align: "start", loop: false }} className="w-full relative">
            <CarouselContent className="-ml-4">
              {newsData.map((story) => {
                const isVideo = isVideoUrl(story.mediaUrl);
                return (
                  <CarouselItem key={story.id} className="pl-4 basis-4/5 md:basis-1/2 lg:basis-1/4">
                    <Link href={`/news/${story.slug || story.id}`} className="block group">
                      <Card className="relative flex flex-col overflow-hidden h-[450px] justify-end text-white rounded-lg">
                          {story.mediaUrl ? (
                            isVideo ? (
                               <video
                                  src={story.mediaUrl}
                                  autoPlay
                                  loop
                                  muted
                                  playsInline
                                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                               />
                            ) : (
                              <Image
                                src={story.mediaUrl}
                                alt={story.title}
                                fill
                                className="object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                            )
                          ) : (
                            <div className="h-full w-full bg-muted" />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent" />
                          <div className="relative z-10 p-6">
                            <p className="text-xs text-white/80 mb-2">{story.publicationDate}</p>
                            <h2 className="font-headline font-normal text-lg leading-tight text-white">
                                {story.title}
                            </h2>
                          </div>
                      </Card>
                    </Link>
                  </CarouselItem>
                )
              })}
            </CarouselContent>
             <div className="absolute top-[-3.5rem] right-0 flex gap-2">
              <CarouselPrevious className="static translate-y-0 rounded-none sm:inline-flex" />
              <CarouselNext className="static translate-y-0 rounded-none sm:inline-flex" />
            </div>
          </Carousel>
           <div className="text-left mt-8">
                <Button asChild variant="outline">
                    <Link href="/news">See All News</Link>
                </Button>
            </div>
        </div>
      </section>

    </div>
  );
}
