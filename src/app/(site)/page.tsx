'use client';

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle, BarChart, Users } from "lucide-react";
import { collection, doc, getDocs } from 'firebase/firestore';

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo } from "react";

const features = [
  {
    icon: <CheckCircle className="h-8 w-8 text-primary" />,
    title: "Streamlined Workflow",
    description: "Experience unparalleled efficiency with our intuitive and powerful platform, designed to simplify complex tasks.",
    image: PlaceHolderImages.find((img) => img.id === "feature-1"),
  },
  {
    icon: <BarChart className="h-8 w-8 text-primary" />,
    title: "Insightful Analytics",
    description: "Gain a competitive edge with real-time data and comprehensive analytics that drive informed decision-making.",
    image: PlaceHolderImages.find((img) => img.id === "feature-2"),
  },
  {
    icon: <Users className="h-8 w-8 text-primary" />,
    title: "Collaborative Environment",
    description: "Foster teamwork and innovation with collaborative tools that connect your team, wherever they are.",
    image: PlaceHolderImages.find((img) => img.id === "feature-3"),
  },
];

interface Section {
  id: string;
  title: string;
  content: string;
}

interface Page {
  id: string;
  title: string;
  sections: Section[];
}

export default function Home() {
  const heroImage = PlaceHolderImages.find(
    (img) => img.id === "hero-background"
  );

  const firestore = useFirestore();
  const pagesRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'pages');
  }, [firestore]);
  
  const { data: pages, isLoading } = useCollection<Page>(pagesRef);

  const homePage = pages?.find(p => p.id === 'home');
  const heroSection = homePage?.sections.find(s => s.id === 'hero');
  const featuresSectionHeader = homePage?.sections.find(s => s.id === 'features');

  return (
    <div className="flex flex-col">
      <section className="container py-8">
        <div className="relative h-[50vh] min-h-[400px] w-full overflow-hidden">
            {heroImage && (
            <Image
                src={heroImage.imageUrl}
                alt={heroImage.description}
                fill
                className="object-cover"
                data-ai-hint={heroImage.imageHint}
                priority
            />
            )}
            <div className="absolute inset-0 bg-black/50" />
            <div className="relative z-10 flex h-full flex-col items-center justify-center text-center text-white p-4">
                {isLoading ? (
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
      </section>

      <section className="py-16">
        <div className="container px-4 md:px-6">
          <div className="mx-auto max-w-2xl text-center">
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-2/3 mx-auto" />
                <Skeleton className="h-5 w-full max-w-lg mx-auto" />
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
            {features.map((feature, index) => {
              const featureSection = homePage?.sections.find(s => s.id === `feature-${index + 1}`);
              return (
                <Card key={feature.title} className="flex flex-col overflow-hidden transition-transform duration-300 ease-in-out hover:-translate-y-2">
                  {feature.image && (
                      <div className="aspect-video overflow-hidden">
                          <Image
                              src={feature.image.imageUrl}
                              alt={feature.image.description}
                              width={600}
                              height={400}
                              className="object-cover w-full h-full"
                              data-ai-hint={feature.image.imageHint}
                          />
                      </div>
                  )}
                  <CardHeader>
                      <div className="mb-4">{feature.icon}</div>
                      <CardTitle className="font-headline font-normal">{isLoading ? <Skeleton className="h-6 w-3/4" /> : (featureSection?.title || feature.title)}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? <div className="space-y-2"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-5/6" /></div> : <CardDescription>{featureSection?.content || feature.description}</CardDescription>}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
