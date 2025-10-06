// src/app/(site)/home-client.tsx
'use client';

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, ArrowRight } from "lucide-react";
import { useState, useMemo } from 'react';

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Combobox } from "@/components/ui/combobox";
import { useIsMobile } from "@/hooks/use-mobile";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { cn } from "@/lib/utils"; // Import cn to use with the video component

// Interfaces
interface Section { id: string; title: string; content: string; imageUrl?: string; }
interface Page { id: string; title: string; sections: Section[]; }
interface Campus { id: string; name: string; slug: string; description?: string; imageUrl?: string; }
interface Category { id: string; name: string; description?: string; mediaUrl?: string; }
interface Theme { id: string; name: string; description?: string; categoryId: string; }
interface Formation { id: string; themeId: string; }

// Props
interface HomeClientProps {
  homePage: Page | null;
  campuses: Campus[];
  categories: Category[];
  themes: Theme[];
  formations: Formation[];
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


export function HomeClient({ homePage, campuses, categories, themes, formations }: HomeClientProps) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);

  // Directly access the sections from the homePage prop
  const heroSection = homePage?.sections.find(s => s.id === 'hero');
  const featuresSectionHeader = homePage?.sections.find(s => s.id === 'features');
  const heroMediaUrl = heroSection?.imageUrl;
  const isHeroVideo = heroMediaUrl ? isVideoUrl(heroMediaUrl) : false;
  
  // Find the three feature sections dynamically
  const featureSections = useMemo(() => {
    const sections = [];
    for (let i = 1; i <= 3; i++) {
        const section = homePage?.sections.find(s => s.id === `feature-${i}`);
        if (section) sections.push(section);
    }
    return sections;
  }, [homePage]);

  const themeOptions = useMemo(() => themes.map(theme => ({ value: theme.id, label: theme.name })), [themes]);

  const handleSearch = () => {
    if (selectedThemeId) router.push(`/courses?themeId=${selectedThemeId}`);
  };

  const categoriesWithThemes = useMemo(() => {
    return categories.map(category => {
      const categoryThemes = themes.filter(theme => theme.categoryId === category.id);
      const formationCount = formations.filter(formation => categoryThemes.some(theme => theme.id === formation.themeId)).length;
      return {
        ...category,
        themes: categoryThemes,
        formationCount: formationCount
      };
    });
  }, [categories, themes, formations]);


  return (
    <div className="flex flex-col">
      <section className="py-8">
        <div className="container px-4 md:px-6">
          <div className="relative h-[50vh] min-h-[400px] w-full overflow-hidden">
              {heroMediaUrl && ( isHeroVideo ? 
                  (<video src={heroMediaUrl} autoPlay loop muted playsInline className="absolute inset-0 h-full w-full object-cover"/>) : 
                  (<Image src={heroMediaUrl} alt={heroSection?.title || ""} fill className="object-cover" priority/>)
              )}
              <div className="absolute inset-0 bg-black/50" />
              <div className="relative z-10 flex h-full flex-col items-center justify-center text-center text-white p-4">
                  <h1 className="text-2xl font-normal tracking-tighter sm:text-3xl md:text-4xl font-headline text-white">{heroSection?.title}</h1>
                  <p className="mx-auto mt-4 max-w-[600px] text-sm text-gray-200 md:text-base">{heroSection?.content}</p>
                  <div className="mt-8 w-full max-w-2xl">
                    <div className="flex flex-col sm:flex-row items-center gap-2 bg-white/20 backdrop-blur-sm p-3 rounded-lg border border-white/30">
                        <Combobox
                          items={themeOptions}
                          value={selectedThemeId}
                          onChange={setSelectedThemeId}
                          placeholder="Rechercher un thème..."
                          searchPlaceholder="Rechercher un thème..."
                          noResultsText="Aucun thème trouvé."
                          className="bg-transparent text-white border-white/50 placeholder:text-gray-200 hover:bg-white/10 hover:text-white"
                        />
                        <Button onClick={handleSearch} className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90"><Search className="mr-2 h-4 w-4" />Rechercher</Button>
                    </div>
                  </div>
              </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container px-4 md:px-6">
          <div className="max-w-2xl">
            <h2 className="text-xl font-normal tracking-tighter sm:text-2xl font-headline">{featuresSectionHeader?.title}</h2>
            <p className="mt-2 text-muted-foreground md:text-base/relaxed">{featuresSectionHeader?.content}</p>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {featureSections.map((featureSection) => (
                <Card key={featureSection.id} className="flex flex-col overflow-hidden transition-transform duration-300 ease-in-out hover:-translate-y-2">
                  <div className="aspect-video relative overflow-hidden">
                    {featureSection.imageUrl && (<Image src={featureSection.imageUrl} alt={featureSection.title} width={600} height={400} className="object-cover w-full h-full"/>)}
                  </div>
                  <CardHeader><CardTitle className="font-headline font-normal">{featureSection.title}</CardTitle></CardHeader>
                  <CardContent><CardDescription>{featureSection.content}</CardDescription></CardContent>
                </Card>
              ))}
          </div>
        </div>
      </section>

       <section className="py-16 bg-muted/30">
        <div className="container px-4 md:px-6">
          <div className="flex items-center justify-between mb-8">
            <div className="max-w-[75%]">
                <h2 className="text-xl font-normal tracking-tighter sm:text-2xl font-headline">Formations IMEDA</h2>
                <p className="mt-2 text-muted-foreground md:text-base/relaxed">
                  <span className="md:hidden">Explorez nos thèmes de formation</span>
                  <span className="hidden md:inline">Explorez nos thèmes de formation pour trouver le programme parfait pour vous.</span>
                </p>
            </div>
          </div>
          <Carousel opts={{ align: "start", loop: false }} className="w-full relative">
          <CarouselContent className="-ml-4">
            {categoriesWithThemes.map((category) => {
                const cardContent = (
                    <Card className="h-full flex flex-col hover:border-primary transition-colors overflow-hidden">
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
                             <CardDescription>{`${category.formationCount} formations`}</CardDescription>
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
                  <CarouselItem key={category.id} className="pl-4 basis-4/5 md:basis-1/2 lg:basis-1/3 flex flex-col">
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
        </div>
      </section>

      <section className="py-16">
        <div className="container px-4 md:px-6">
          <div className="flex items-center justify-between mb-8">
            <div className="max-w-[75%]">
                <h2 className="text-xl font-normal tracking-tighter sm:text-2xl font-headline">Our Campuses</h2>
                <p className="mt-2 text-muted-foreground md:text-base/relaxed">
                    <span className="md:hidden">Explore our world-class campuses</span>
                    <span className="hidden md:inline">Explore our world-class campuses located in global hubs of innovation.</span>
                </p>
            </div>
          </div>
          {isMobile ? (
             <Carousel className="w-full relative" opts={{ align: "start", loop: true }}>
                <CarouselContent className="-ml-4">
                  {campuses.map((campus) => (
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
              {campuses.map((campus, index) => (<CampusCardDisplay key={campus.id} campus={campus} className={index === 0 ? 'md:row-span-2' : ''} />))}
            </div>
          )}
        </div>
      </section>

      <section className="py-16">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-y-8 md:gap-x-8 text-left">
            <div><p className="text-4xl lg:text-5xl font-headline text-primary">700+</p><p className="mt-2 font-semibold">Formations Internationales</p><p className="text-sm text-muted-foreground">Disponibles dans nos campus et en ligne.</p></div>
            <div><p className="text-4xl lg:text-5xl font-headline text-primary">95%</p><p className="mt-2 font-semibold">Taux de placement</p><p className="text-sm text-muted-foreground">De nos diplômés dans les 6 mois.</p></div>
            <div><p className="text-4xl lg:text-5xl font-headline text-primary">120+</p><p className="mt-2 font-semibold">Nationalités</p><p className="text-sm text-muted-foreground">Représentées parmi nos étudiants.</p></div>
          </div>
        </div>
      </section>
    </div>
  );
}
