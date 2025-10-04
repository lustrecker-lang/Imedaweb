

'use client';

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle, BarChart, Users, Search } from "lucide-react";
import { doc, collection, query, orderBy } from 'firebase/firestore';
import { useState, useMemo } from 'react';

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Combobox } from "@/components/ui/combobox";
import { useFirestore, useDoc, useCollection, useMemoFirebase } from "@/firebase";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"

const featuresPlaceholders = [
  {
    id: "feature-1",
    icon: <CheckCircle className="h-8 w-8 text-primary" />,
    title: "Streamlined Workflow",
    description: "Experience unparalleled efficiency with our intuitive and powerful platform, designed to simplify complex tasks.",
  },
  {
    id: "feature-2",
    icon: <BarChart className="h-8 w-8 text-primary" />,
    title: "Insightful Analytics",
    description: "Gain a competitive edge with real-time data and comprehensive analytics that drive informed decision-making.",
  },
  {
    id: "feature-3",
    icon: <Users className="h-8 w-8 text-primary" />,
    title: "Collaborative Environment",
    description: "Foster teamwork and innovation with collaborative tools that connect your team, wherever they are.",
  },
];

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

interface Campus {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
}

interface Theme {
  id: string;
  name: string;
  description?: string;
}

interface Formation {
    id: string;
    themeId: string;
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

export default function Home() {
  const firestore = useFirestore();
  const router = useRouter();
  const isMobile = useIsMobile();
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);

  const pageRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'pages', 'home');
  }, [firestore]);
  
  const { data: homePage, isLoading: isPageLoading } = useDoc<Page>(pageRef);

  const campusesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'campuses'), orderBy('name', 'asc'));
  }, [firestore]);

  const { data: campuses, isLoading: areCampusesLoading } = useCollection<Campus>(campusesQuery);

  const themesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'course_themes'), orderBy('name', 'asc'));
  }, [firestore]);

  const { data: themes, isLoading: areThemesLoading } = useCollection<Theme>(themesQuery);
  
  const formationsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'course_formations'));
  }, [firestore]);

  const { data: formations, isLoading: areFormationsLoading } = useCollection<Formation>(formationsQuery);


  const heroSection = homePage?.sections.find(s => s.id === 'hero');
  const featuresSectionHeader = homePage?.sections.find(s => s.id === 'features');
  const heroMediaUrl = heroSection?.imageUrl;
  
  const isHeroVideo = heroMediaUrl ? isVideoUrl(heroMediaUrl) : false;

  const isLoading = isPageLoading || areCampusesLoading || areThemesLoading || areFormationsLoading;

  const themeOptions = useMemo(() => {
    return themes ? themes.map(theme => ({ value: theme.id, label: theme.name })) : [];
  }, [themes]);

  const handleSearch = () => {
    if (selectedThemeId) {
      router.push(`/courses?themeId=${selectedThemeId}`);
    }
  };

  const themesWithFormationCounts = useMemo(() => {
    if (!themes || !formations) return [];
    return themes.map(theme => {
        const count = formations.filter(formation => formation.themeId === theme.id).length;
        return { ...theme, formationCount: count };
    });
  }, [themes, formations]);

  const CampusCard = ({ campus, className }: { campus: Campus, className?: string }) => {
    const isCardVideo = isVideoUrl(campus.imageUrl);
    return (
        <Link href={`/campus/${campus.slug}`} className={`group relative block overflow-hidden rounded-lg ${className}`}>
        {isCardVideo ? (
             <video
                src={campus.imageUrl}
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
            />
        ) : (
            <Image
                src={campus.imageUrl || `https://picsum.photos/seed/${campus.id}/800/600`}
                alt={campus.name}
                fill
                className="object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
            />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/0" />
        <div className="relative flex h-full flex-col justify-end p-6">
            <h3 className="text-lg font-normal text-white font-headline">
            {campus.name}
            </h3>
            {campus.description && (
            <p className="text-xs text-white/80 mt-1 line-clamp-2">{campus.description}</p>
            )}
        </div>
        </Link>
    );
  };


  return (
    <div className="flex flex-col">
      <section className="py-8">
        <div className="container px-4 md:px-6">
          <div className="relative h-[60vh] min-h-[400px] md:min-h-[500px] w-full overflow-hidden">
              {isLoading ? (
                <Skeleton className="h-full w-full" />
              ) : (
                heroMediaUrl && (
                    isHeroVideo ? (
                        <video
                            src={heroMediaUrl}
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="absolute inset-0 h-full w-full object-cover"
                        />
                    ) : (
                        <Image
                            src={heroMediaUrl}
                            alt={heroSection?.title || ""}
                            fill
                            className="object-cover"
                            priority
                        />
                    )
                )
              )}
              <div className="absolute inset-0 bg-black/50" />
              <div className="relative z-10 flex h-full flex-col items-center justify-center text-center text-white p-4">
                  {isPageLoading ? (
                  <div className="w-full max-w-3xl space-y-4">
                      <Skeleton className="h-12 w-3/4 mx-auto bg-gray-400/50" />
                      <Skeleton className="h-6 w-full max-w-2xl mx-auto bg-gray-400/50" />
                  </div>
                  ) : (
                  <>
                      <h1 className="text-2xl font-normal tracking-tighter sm:text-3xl md:text-4xl font-headline text-white">
                      {heroSection?.title}
                      </h1>
                      <p className="mx-auto mt-4 max-w-[600px] text-sm text-gray-200 md:text-base">
                      {heroSection?.content}
                      </p>
                  </>
                  )}
                  <div className="mt-8 w-full max-w-2xl">
                    <div className="flex flex-col sm:flex-row items-center gap-2 bg-white/20 backdrop-blur-sm p-3 rounded-lg border border-white/30">
                        <Combobox
                            items={themeOptions}
                            value={selectedThemeId}
                            onChange={setSelectedThemeId}
                            placeholder="Rechercher un thème..."
                            searchPlaceholder="Rechercher un thème..."
                            noResultsText="Aucun thème trouvé."
                        />
                        <Button onClick={handleSearch} className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90">
                           <Search className="mr-2 h-4 w-4" />
                           Rechercher
                        </Button>
                    </div>
                  </div>
              </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container px-4 md:px-6">
          <div className="max-w-2xl">
            {isPageLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-2/3" />
                <Skeleton className="h-5 w-full max-w-lg" />
              </div>
            ) : (
              <>
                <h2 className="text-xl font-normal tracking-tighter sm:text-2xl font-headline">
                  {featuresSectionHeader?.title}
                </h2>
                <p className="mt-2 text-muted-foreground md:text-base/relaxed">
                  {featuresSectionHeader?.content}
                </p>
              </>
            )}
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {featuresPlaceholders.map((feature, index) => {
              const featureSection = homePage?.sections.find(s => s.id === `feature-${index + 1}`);
              const featureImageUrl = featureSection?.imageUrl;

              return (
                <Card key={feature.title} className="flex flex-col overflow-hidden transition-transform duration-300 ease-in-out hover:-translate-y-2">
                  <div className="aspect-video overflow-hidden">
                    {isPageLoading ? (
                      <Skeleton className="w-full h-full" />
                    ) : (
                      featureImageUrl && (
                        <Image
                            src={featureImageUrl}
                            alt={featureSection?.title || ""}
                            width={600}
                            height={400}
                            className="object-cover w-full h-full"
                        />
                      )
                    )}
                  </div>
                  <CardHeader>
                      <CardTitle className="font-headline font-normal">{isPageLoading ? <Skeleton className="h-6 w-3/4" /> : (featureSection?.title)}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isPageLoading ? <div className="space-y-2"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-5/6" /></div> : <CardDescription>{featureSection?.content}</CardDescription>}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

       <section className="py-16 bg-muted/30">
        <div className="container px-4 md:px-6">
          <div className="flex items-center justify-between mb-8">
            <div className="max-w-2xl">
                <h2 className="text-xl font-normal tracking-tighter sm:text-2xl font-headline">
                  Formations IMEDA
                </h2>
                <p className="mt-2 text-muted-foreground md:text-base/relaxed">
                  Explorez nos thèmes de formation pour trouver le programme parfait pour vous.
                </p>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-56 w-full" />)}
            </div>
          ) : (
            <Carousel opts={{ align: "start", loop: false }} className="w-full">
                <CarouselContent className="-ml-4">
                {themesWithFormationCounts.map((theme) => (
                    <CarouselItem key={theme.id} className="pl-4 basis-4/5 md:basis-1/2 lg:basis-1/3">
                        <Link href={`/courses?themeId=${theme.id}`} className="block h-full">
                            <Card className="h-full flex flex-col hover:border-primary transition-colors">
                                <CardHeader>
                                    <CardTitle className="font-headline font-normal">{theme.name}</CardTitle>
                                </CardHeader>
                                <CardContent className="flex-grow">
                                    <CardDescription className="line-clamp-3">
                                        {theme.description || "Aucune description pour ce thème."}
                                    </CardDescription>
                                </CardContent>
                                <div className="p-6 pt-0 text-xs text-muted-foreground font-semibold">
                                    {theme.formationCount} {theme.formationCount > 1 ? 'formations' : 'formation'}
                                </div>
                            </Card>
                        </Link>
                    </CarouselItem>
                ))}
                </CarouselContent>
                 <div className="absolute top-[-4.5rem] right-0 flex gap-2">
                    <CarouselPrevious className="static translate-y-0 rounded-none inline-flex" />
                    <CarouselNext className="static translate-y-0 rounded-none inline-flex" />
                 </div>
            </Carousel>
          )}
        </div>
      </section>

      <section className="py-16">
        <div className="container px-4 md:px-6">
          <div className="flex items-center justify-between mb-8">
            <div className="max-w-[75%]">
                <h2 className="text-xl font-normal tracking-tighter sm:text-2xl font-headline">
                  Our Campuses
                </h2>
                <p className="mt-2 text-muted-foreground md:text-base/relaxed">
                  {isMobile ? "Explore our world-class campuses" : "Explore our world-class campuses located in global hubs of innovation."}
                </p>
            </div>
          </div>

          {isLoading ? (
            <div className="mt-12 grid h-[50vh] min-h-[400px] grid-cols-1 grid-rows-3 gap-6 md:grid-cols-2 md:grid-rows-2">
              <Skeleton className="h-full w-full md:row-span-2" />
              <Skeleton className="h-full w-full" />
              <Skeleton className="h-full w-full" />
            </div>
          ) : isMobile ? (
             <Carousel className="w-full relative" opts={{ align: "start", loop: true }}>
                <CarouselContent className="-ml-4">
                  {campuses && campuses.map((campus) => (
                    <CarouselItem key={campus.id} className="basis-4/5 pl-4">
                      <div className="h-[40vh] min-h-[350px] w-full">
                        <CampusCard campus={campus} className="h-full w-full" />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <div className="absolute top-[-3.5rem] right-0 flex gap-2">
                  <CarouselPrevious className="static translate-y-0 rounded-none" />
                  <CarouselNext className="static translate-y-0 rounded-none" />
                </div>
            </Carousel>
          ) : (
            <div className="mt-12 grid h-[50vh] min-h-[400px] grid-cols-1 grid-rows-3 gap-6 md:grid-cols-2 md:grid-rows-2">
              {campuses && campuses.map((campus, index) => (
                <CampusCard key={campus.id} campus={campus} className={index === 0 ? 'md:row-span-2' : ''} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-16">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-y-8 md:gap-x-8 text-left">
            <div>
              <p className="text-4xl lg:text-5xl font-headline text-primary">700+</p>
              <p className="mt-2 font-semibold">Formations Internationales</p>
              <p className="text-sm text-muted-foreground">Disponibles dans nos campus et en ligne.</p>
            </div>
            <div>
              <p className="text-4xl lg:text-5xl font-headline text-primary">95%</p>
              <p className="mt-2 font-semibold">Taux de placement</p>
              <p className="text-sm text-muted-foreground">De nos diplômés dans les 6 mois.</p>
            </div>
            <div>
              <p className="text-4xl lg:text-5xl font-headline text-primary">120+</p>
              <p className="mt-2 font-semibold">Nationalités</p>
              <p className="text-sm text-muted-foreground">Représentées parmi nos étudiants.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
    