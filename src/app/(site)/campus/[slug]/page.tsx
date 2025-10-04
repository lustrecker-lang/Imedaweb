
'use client';

import Image from "next/image";
import { collection, query, where, getDocs, DocumentData } from 'firebase/firestore';
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useFirestore, useMemoFirebase } from "@/firebase";
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

  const [campus, setCampus] = useState<Campus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const campusQuery = useMemoFirebase(() => {
    if (!firestore || !slug) return null;
    return query(collection(firestore, 'campuses'), where('slug', '==', slug));
  }, [firestore, slug]);

  useEffect(() => {
    if (!campusQuery) {
      setIsLoading(false);
      return;
    };

    const fetchCampus = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const querySnapshot = await getDocs(campusQuery);
        if (querySnapshot.empty) {
          setError("No campus found for this URL.");
          setCampus(null);
        } else {
          const doc = querySnapshot.docs[0];
          setCampus({ id: doc.id, ...(doc.data() as Omit<Campus, 'id'>) });
        }
      } catch (e) {
        console.error("Error fetching campus:", e);
        setError("Failed to load campus data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCampus();
  }, [campusQuery]);
  
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
    return <div className="container py-12 text-center text-destructive">{error}</div>
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
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl font-headline text-white">
                {campus.hero?.title || campus.name}
            </h1>
             {campus.hero?.subtitle && (
                <p className="mx-auto mt-4 max-w-[700px] text-gray-200 md:text-lg">
                    {campus.hero.subtitle}
                </p>
            )}
        </div>
      </section>

      <main className="container py-12 md:py-16 lg:py-20">
        <div className="grid md:grid-cols-12 gap-8 lg:gap-12">
            <div className="md:col-span-8 space-y-12">
                
                {/* Campus Description */}
                <section id="description">
                     <Card>
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <Building className="h-6 w-6 text-primary" />
                                <CardTitle className="text-2xl font-headline font-normal">{campus.campusDescription?.headline || `About ${campus.name}`}</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">{campus.campusDescription?.body}</p>
                        </CardContent>
                    </Card>
                </section>
                
                {/* Academic Offering */}
                <section id="academics">
                     <Card>
                        <CardHeader>
                             <div className="flex items-center gap-3">
                                <GraduationCap className="h-6 w-6 text-primary" />
                                <CardTitle className="text-2xl font-headline font-normal">{campus.academicOffering?.headline || "Academic Offering"}</CardTitle>
                            </div>
                            {campus.academicOffering?.subtitle && <CardDescription>{campus.academicOffering.subtitle}</CardDescription>}
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">Course list will be displayed here soon.</p>
                        </CardContent>
                    </Card>
                </section>
                
                {/* Campus Experience */}
                {campus.campusExperience?.features && campus.campusExperience.features.length > 0 && (
                    <section id="experience">
                         <Card>
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <Sparkles className="h-6 w-6 text-primary" />
                                    <CardTitle className="text-2xl font-headline font-normal">{campus.campusExperience.headline || "Campus Experience"}</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="grid gap-6">
                                {campus.campusExperience.features.map(feature => (
                                     <div key={feature.id} className="flex gap-4">
                                        {feature.mediaUrl && (
                                             <Image src={feature.mediaUrl} alt={feature.name} width={150} height={100} className="rounded-md object-cover hidden sm:block"/>
                                        )}
                                        <div>
                                            <h3 className="font-semibold">{feature.name}</h3>
                                            <p className="text-sm text-muted-foreground">{feature.description}</p>
                                        </div>
                                     </div>
                                ))}
                            </CardContent>
                        </Card>
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
                            {campus.visitAndContact?.subtitle && <CardDescription>{campus.visitAndContact.subtitle}</CardDescription>}
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
                                            <AccordionContent>
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
