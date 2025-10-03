'use client';

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle, BarChart, Users } from "lucide-react";
import { doc } from 'firebase/firestore';

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { useFirestore, useDoc } from "@/firebase";
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

interface HomePageContent {
  title: string;
  content: string;
}

export default function Home() {
  const heroImage = PlaceHolderImages.find(
    (img) => img.id === "hero-background"
  );

  const firestore = useFirestore();
  const contentRef = useMemo(() => {
    if (!firestore) return null;
    return doc(firestore, 'homePageContent', 'main');
  }, [firestore]);
  
  const { data: homePageContent, isLoading } = useDoc<HomePageContent>(contentRef);

  return (
    <div className="flex flex-col">
      <section className="relative h-[60vh] min-h-[500px] w-full">
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
        <div className="relative z-10 flex h-full flex-col items-center justify-center text-center text-white">
          <div className="container px-4 md:px-6">
            {isLoading ? (
              <>
                <Skeleton className="h-16 w-3/4 max-w-3xl mx-auto bg-gray-400/50" />
                <Skeleton className="h-8 w-full max-w-2xl mx-auto mt-4 bg-gray-400/50" />
              </>
            ) : (
              <>
                <h1 className="text-4xl font-normal tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl font-headline text-white">
                  {homePageContent?.title || "Innovate. Manage. Excel."}
                </h1>
                <p className="mx-auto mt-4 max-w-[700px] text-lg text-gray-200 md:text-xl">
                  {homePageContent?.content || "IMEDA provides the tools you need to elevate your business operations to the next level."}
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

      <section className="py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-normal tracking-tighter sm:text-4xl font-headline">
              Features Designed for Growth
            </h2>
            <p className="mt-4 text-muted-foreground md:text-xl/relaxed">
              Our platform is packed with powerful features to help you succeed.
            </p>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
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
                    <CardTitle className="font-headline font-normal">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
