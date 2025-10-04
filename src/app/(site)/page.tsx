
'use client';

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle, BarChart, Users } from "lucide-react";
import { doc, collection, query, orderBy } from 'firebase/firestore';

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

export default function Home() {
  const firestore = useFirestore();
  const isMobile = useIsMobile();
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

  const heroSection = homePage?.sections.find(s => s.id === 'hero');
  const featuresSectionHeader = homePage?.sections.find(s => s.id === 'features');
  const heroImageUrl = heroSection?.imageUrl;

  const isLoading = isPageLoading || areCampusesLoading;

  const CampusCard = ({ campus, className }: { campus: Campus, className?: string }) => (
    <Link href={`/campus/${campus.slug}`} className={`group relative block overflow-hidden rounded-lg ${className}`}>
      <Image
        src={campus.imageUrl || `https://picsum.photos/seed/${campus.id}/800/600`}
        alt={campus.name}
        fill
        className="object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
      />
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

  return (
    <div className="flex flex-col">
      <section className="py-8">
        <div className="container px-4 md:px-6">
          <div className="relative h-[50vh] min-h-[400px] w-full overflow-hidden">
              {isPageLoading ? (
                <Skeleton className="h-full w-full" />
              ) : (
                heroImageUrl && (
                  <Image
                      src={heroImageUrl}
                      alt={heroSection?.title || "Hero background"}
                      fill
                      className="object-cover"
                      priority
                  />
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
                      {heroSection?.title || "Innovate. Manage. Excel."}
                      </h1>
                      <p className="mx-auto mt-4 max-w-[600px] text-sm text-gray-200 md:text-base">
                      {heroSection?.content || "IMEDA provides the tools you need to elevate your business operations to the next level."}
                      </p>
                  </>
                  )}
                  <div className="mt-6">
                  <Button asChild size="lg" className="bg-white text-primary hover:bg-gray-200">
                      <Link href="#">
                      Get Started <ArrowRight className="ml-2 h-5 w-5" />
                      </Link>
                  </Button>
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
                  {featuresSectionHeader?.title || "Features Designed for Growth"}
                </h2>
                <p className="mt-2 text-muted-foreground md:text-base/relaxed">
                  {featuresSectionHeader?.content || "Our platform is packed with powerful features to help you succeed."}
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
                      <CardTitle className="font-headline font-normal">{isPageLoading ? <Skeleton className="h-6 w-3/4" /> : (featureSection?.title || feature.title)}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isPageLoading ? <div className="space-y-2"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-5/6" /></div> : <CardDescription>{featureSection?.content || feature.description}</CardDescription>}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container px-4 md:px-6">
          <div className="flex items-center justify-between mb-8">
            <div className="max-w-2xl">
                <h2 className="text-xl font-normal tracking-tighter sm:text-2xl font-headline">
                  Our Campuses
                </h2>
                <p className="mt-2 text-muted-foreground md:text-base/relaxed">
                  Explore our world-class campuses located in global hubs of innovation.
                </p>
            </div>
            {isMobile && (
              <div className="flex gap-2">
                <CarouselPrevious className="relative -left-0 top-0 translate-y-0" />
                <CarouselNext className="relative -right-0 top-0 translate-y-0" />
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="mt-12 grid h-[50vh] min-h-[400px] grid-cols-1 grid-rows-3 gap-6 md:grid-cols-2 md:grid-rows-2">
              <Skeleton className="h-full w-full md:row-span-2" />
              <Skeleton className="h-full w-full" />
              <Skeleton className="h-full w-full" />
            </div>
          ) : isMobile ? (
             <Carousel className="w-full" opts={{ align: "start", loop: true }}>
                <CarouselContent className="-ml-4">
                  {campuses && campuses.map((campus) => (
                    <CarouselItem key={campus.id} className="basis-4/5 pl-4">
                      <div className="h-[50vh] min-h-[400px] w-full">
                        <CampusCard campus={campus} className="h-full w-full" />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
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
    </div>
  );
}
