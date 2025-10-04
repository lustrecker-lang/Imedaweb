
'use client';

import Image from "next/image";
import { collection, query, where, DocumentData } from 'firebase/firestore';
import { useParams } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { useFirestore, useMemoFirebase, useCollection } from "@/firebase";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Building, GraduationCap, MapPin, Sparkles, HelpCircle } from "lucide-react";

interface CampusFeature {
    id: string;
    name: string;
    description?: string;
    mediaUrl?: string;
}

interface CampusFaq {
    id: string;
    question: string;
    answer?: string;
}

interface CampusCourse {
    id: string;
    name: string;
    description?: string;
}

interface Campus {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  hero?: {
    backgroundMediaUrl?: string;
    title?: string;
    subtitle?: string;
  };
  campusDescription?: {
    headline?: string;
    body?: string;
  };
  academicOffering?: {
    headline?: string;
    subtitle?: string;
    courses?: CampusCourse[];
  };
  campusExperience?: {
    headline?: string;
    features?: CampusFeature[];
  };
  visitAndContact?: {
    headline?: string;
    subtitle?: string;
    address?: string;
  };
  faq?: {
    headline?: string;
    faqs?: CampusFaq[];
  };
}

export default function CampusPage() {
  const firestore = useFirestore();
  const params = useParams();
  const slug = params.slug as string;

  const campusQuery = useMemoFirebase(() => {
    if (!firestore || !slug) return null;
    return query(collection(firestore, 'campuses'), where('slug', '==', slug));
  }, [firestore, slug]);

  const { data: campuses, isLoading, error } = useCollection<Campus>(campusQuery);
  const campus = useMemo(() => (campuses && campuses.length > 0 ? campuses[0] : null), [campuses]);
  
  if (isLoading) {
    return (
        <div className="container py-8 space-y-12">
            <Skeleton className="h-[50vh] w-full" />
            <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-8">
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-48 w-full" />
                </div>
                <div className="space-y-8">
                     <Skeleton className="h-64 w-full" />
                </div>
            </div>
        </div>
    )
  }

  if (error) {
    return <div className="container py-12 text-center text-destructive">{error.message}</div>
  }

  if (!campus) {
    return <div className="container py-12 text-center text-muted-foreground">Campus not found.</div>
  }

  return (
    <div className="flex flex-col">
      <section className="relative h-[50vh] min-h-[350px] w-full flex items-center justify-center text-white text-center p-4">
        {campus.hero?.backgroundMediaUrl ? (
            <Image
                src={campus.hero.backgroundMediaUrl}
                alt={campus.hero.title || campus.name}
                fill
                className="object-cover"
                priority
            />
        ) : (
          <div className="absolute inset-0 bg-slate-800" />
        )}
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 max-w-4xl">
            <h1 className="text-3xl font-normal tracking-tighter sm:text-4xl md:text-5xl font-headline text-white">
                {campus.hero?.title || "Welcome"}
            </h1>
             {campus.hero?.subtitle && (
                <p className="mx-auto mt-4 max-w-[700px] text-gray-200 text-sm md:text-base">
                    {campus.hero.subtitle}
                </p>
            )}
        </div>
      </section>

      <main className="container py-12 md:py-16 lg:py-20">
        <div className="grid md:grid-cols-12 gap-8 lg:gap-12">
            <div className="md:col-span-8 space-y-12">
                
                {/* Campus Description */}
                {campus.campusDescription && (campus.campusDescription.headline || campus.campusDescription.body) && (
                    <section id="description">
                        <div className="max-w-2xl">
                             <h2 className="text-2xl font-normal tracking-tighter sm:text-3xl font-headline">{campus.campusDescription.headline || `About ${campus.name}`}</h2>
                             <p className="mt-2 text-muted-foreground md:text-base/relaxed whitespace-pre-wrap">{campus.campusDescription.body}</p>
                        </div>
                    </section>
                )}
                
                {/* Academic Offering */}
                <section id="academics">
                     <div className="max-w-2xl">
                        <h2 className="text-2xl font-normal tracking-tighter sm:text-3xl font-headline">{campus.academicOffering?.headline || "Academic Offering"}</h2>
                        {campus.academicOffering?.subtitle && <p className="mt-2 text-muted-foreground md:text-base/relaxed">{campus.academicOffering.subtitle}</p>}
                        <p className="mt-4 text-sm text-muted-foreground">Course list will be displayed here soon.</p>
                    </div>
                </section>
                
                {/* Campus Experience */}
                {campus.campusExperience?.features && campus.campusExperience.features.length > 0 && (
                    <section id="experience">
                        <div className="max-w-2xl">
                            <h2 className="text-2xl font-normal tracking-tighter sm:text-3xl font-headline">{campus.campusExperience.headline || "Campus Experience"}</h2>
                        </div>
                        <div className="grid gap-8 mt-8">
                            {campus.campusExperience.features.map(feature => (
                                 <div key={feature.id} className="flex gap-6 items-start">
                                    {feature.mediaUrl && (
                                         <Image src={feature.mediaUrl} alt={feature.name} width={150} height={100} className="rounded-md object-cover hidden sm:block"/>
                                    )}
                                    <div>
                                        <h3 className="font-semibold text-lg">{feature.name}</h3>
                                        <p className="text-sm text-muted-foreground mt-1">{feature.description}</p>
                                    </div>
                                 </div>
                            ))}
                        </div>
                    </section>
                )}

            </div>
            <aside className="md:col-span-4 space-y-8 md:sticky top-24 self-start">
                
                {/* Visit & Contact */}
                <section id="contact">
                    <Card>
                        <CardHeader>
                             <div className="flex items-center gap-3">
                                <MapPin className="h-6 w-6 text-primary" />
                                <CardTitle className="text-xl font-headline font-normal">{campus.visitAndContact?.headline || "Visit & Contact"}</CardTitle>
                            </div>
                            {campus.visitAndContact?.subtitle && <CardDescription className="pt-2 text-sm">{campus.visitAndContact.subtitle}</CardDescription>}
                        </CardHeader>
                        <CardContent>
                           <p className="text-sm text-muted-foreground whitespace-pre-wrap">{campus.visitAndContact?.address}</p>
                        </CardContent>
                    </Card>
                </section>

                {/* FAQ */}
                {campus.faq?.faqs && campus.faq.faqs.length > 0 && (
                    <section id="faq">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <HelpCircle className="h-6 w-6 text-primary" />
                                    <CardTitle className="text-xl font-headline font-normal">{campus.faq.headline || "FAQ"}</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <Accordion type="single" collapsible className="w-full">
                                    {campus.faq.faqs.map(faq => (
                                         <AccordionItem value={faq.id} key={faq.id}>
                                            <AccordionTrigger>{faq.question}</AccordionTrigger>
                                            <AccordionContent className="text-sm text-muted-foreground">
                                                {faq.answer}
                                            </AccordionContent>
                                        </AccordionItem>
                                    ))}
                                </Accordion>
                            </CardContent>
                        </Card>
                    </section>
                )}

            </aside>
        </div>
      </main>
    </div>
  );
}
