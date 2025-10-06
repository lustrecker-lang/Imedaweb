

'use client';

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { useFirestore, useMemoFirebase, useCollection } from "@/firebase";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Building, GraduationCap, MapPin, Sparkles, HelpCircle, Phone, Mail, ChevronRight } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

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
    name?: string;
    title?: string;
    description?: string;
    phone?: string;
    email?: string;
    imageUrl?: string;
  };
  faq?: {
    headline?: string;
    faqs?: CampusFaq[];
  };
}

interface Category {
    id: string;
    name: string;
    mediaUrl?: string;
}

interface Theme {
    id: string;
    name: string;
    categoryId: string;
}

interface CampusDetailViewProps {
  campus: Campus | null;
  categories: Category[];
  themes: Theme[];
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

export default function CampusDetailView({ campus, categories, themes }: CampusDetailViewProps) {
  
  if (!campus) {
    return <div className="container py-12 text-center text-muted-foreground">Campus not found.</div>
  }
  
  const isHeroVideo = isVideoUrl(campus.hero?.backgroundMediaUrl);

  const categoriesWithThemes = useMemo(() => {
    return categories.map(category => ({
      ...category,
      themes: themes.filter(theme => theme.categoryId === category.id)
    }));
  }, [categories, themes]);


  return (
    <div className="flex flex-col">
       <header className="py-8">
            <div className="container">
                <Card className="relative h-[30vh] min-h-[250px] w-full flex items-end justify-start text-white text-left p-6 md:p-8 lg:p-12 overflow-hidden rounded-lg">
                    {campus.hero?.backgroundMediaUrl ? (
                        isHeroVideo ? (
                            <video
                                src={campus.hero.backgroundMediaUrl}
                                autoPlay
                                loop
                                muted
                                playsInline
                                className="absolute inset-0 h-full w-full object-cover"
                            />
                        ) : (
                            <Image
                                src={campus.hero.backgroundMediaUrl}
                                alt={campus.hero.title || campus.name}
                                fill
                                className="object-cover"
                                priority
                            />
                        )
                    ) : (
                    <div className="absolute inset-0 bg-slate-800" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
                    <div className="relative z-10 max-w-2xl">
                        <h1 className="text-3xl font-normal tracking-tighter sm:text-4xl md:text-5xl font-headline text-white">
                            {campus.hero?.title || "Welcome"}
                        </h1>
                        {campus.hero?.subtitle && (
                            <p className="mt-2 max-w-[700px] text-gray-200 text-sm md:text-base">
                                {campus.hero.subtitle}
                            </p>
                        )}
                    </div>
                </Card>
            </div>
        </header>
      <main className="container pt-8 pb-12 md:pt-12 md:pb-16 lg:pb-20">

        <div className="grid md:grid-cols-12 gap-8 lg:gap-12">
            <div className="md:col-span-8 space-y-12">
                
                {/* Campus Description */}
                {campus.campusDescription && (campus.campusDescription.headline || campus.campusDescription.body) && (
                    <section id="description">
                        <div className="max-w-2xl">
                            <h2 className="text-xl font-normal tracking-tighter sm:text-2xl font-headline">{campus.campusDescription.headline || `About ${campus.name}`}</h2>
                             <p className="mt-2 text-muted-foreground md:text-base/relaxed whitespace-pre-wrap">{campus.campusDescription.body}</p>
                        </div>
                    </section>
                )}
                
                {/* Academic Offering */}
                <section id="academics">
                     <div className="max-w-2xl mb-8">
                        <h2 className="text-xl font-normal tracking-tighter sm:text-2xl font-headline">{campus.academicOffering?.headline || "Academic Offering"}</h2>
                        {campus.academicOffering?.subtitle && <p className="mt-2 text-muted-foreground md:text-base/relaxed">{campus.academicOffering.subtitle}</p>}
                    </div>

                    <Accordion type="multiple" className="w-full">
                        {categoriesWithThemes.map((category) => (
                            <AccordionItem value={category.id} key={category.id}>
                                <AccordionTrigger>
                                    <div className="flex items-center justify-between w-full">
                                        <h3 className="font-headline font-normal text-lg">{category.name}</h3>
                                        <p className="text-sm text-muted-foreground mr-4">{category.themes.length} Thèmes</p>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <ul className="pt-2 pl-4 space-y-3">
                                        {category.themes.map(theme => (
                                            <li key={theme.id}>
                                                <Link href={`/courses?themeId=${theme.id}`} className="flex items-center text-sm text-primary hover:underline transition-colors">
                                                    <ChevronRight className="h-4 w-4 mr-2" />
                                                    {theme.name}
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </section>
                
                {/* Campus Experience */}
                {campus.campusExperience?.features && campus.campusExperience.features.length > 0 && (
                    <section id="experience">
                        <div className="max-w-2xl">
                            <h2 className="text-xl font-normal tracking-tighter sm:text-2xl font-headline">{campus.campusExperience.headline || "Campus Experience"}</h2>
                        </div>
                        <div className="grid gap-8 mt-8">
                            {campus.campusExperience.features.map(feature => (
                                 <div key={feature.id} className="flex gap-6 items-start">
                                    {feature.mediaUrl && (
                                         <Image src={feature.mediaUrl} alt={feature.name} width={150} height={100} className="rounded-md object-cover hidden sm:block"/>
                                    )}
                                    <div>
                                        <h3 className="font-headline font-normal text-xl">{feature.name}</h3>
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
                <section id="contact-info">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl font-headline font-normal">
                                {campus.visitAndContact?.headline || "Visit & Contact"}
                            </CardTitle>
                             {campus.visitAndContact?.subtitle && <CardDescription className="pt-2 text-sm">{campus.visitAndContact.subtitle}</CardDescription>}
                        </CardHeader>
                        <CardContent>
                           <p className="text-sm text-muted-foreground whitespace-pre-wrap">{campus.visitAndContact?.address}</p>
                        </CardContent>
                    </Card>
                </section>

                {/* Contact Person */}
                {campus.visitAndContact?.name && (
                     <section id="contact-person">
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex flex-col md:flex-row gap-4 md:text-left">
                                    {campus.visitAndContact.imageUrl && (
                                        <div className="relative h-24 w-24 rounded-md overflow-hidden shrink-0 mx-auto md:mx-0">
                                            <Image src={campus.visitAndContact.imageUrl} alt={campus.visitAndContact.name} fill className="object-cover" />
                                        </div>
                                    )}
                                    <div className="flex-1 text-center md:text-left">
                                        <h3 className="font-headline font-normal text-lg">{campus.visitAndContact.name}</h3>
                                        <p className="text-sm text-primary/80">{campus.visitAndContact.title}</p>
                                        <p className="text-xs text-muted-foreground mt-2">{campus.visitAndContact.description}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-center md:items-start gap-2 mt-4 border-t pt-4">
                                    {campus.visitAndContact.phone && <a href={`tel:${campus.visitAndContact.phone}`} className="flex items-center gap-2 text-base text-primary hover:underline"><Phone size={18} /><span>{campus.visitAndContact.phone}</span></a>}
                                    {campus.visitAndContact.email && <a href={`mailto:${campus.visitAndContact.email}`} className="flex items-center gap-2 text-base text-primary hover:underline"><Mail size={18} /><span>{campus.visitAndContact.email}</span></a>}
                                </div>
                            </CardContent>
                        </Card>
                    </section>
                )}


                {/* FAQ */}
                {campus.faq?.faqs && campus.faq.faqs.length > 0 && (
                    <section id="faq">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-xl font-headline font-normal">{campus.faq.headline || "FAQ"}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Accordion type="single" collapsible className="w-full">
                                    {campus.faq.faqs.map(faq => (
                                         <AccordionItem value={faq.id} key={faq.id}>
                                            <AccordionTrigger className="text-left font-normal text-sm">
                                                {faq.question}
                                            </AccordionTrigger>
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
