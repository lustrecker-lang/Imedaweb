'use client';

import Image from "next/image";
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { useFirestore, useMemoFirebase } from "@/firebase";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface Feature {
  id: string;
  name: string;
  description?: string;
  mediaUrl?: string;
}

interface FAQ {
  id: string;
  question: string;
  answer?: string;
}

interface Campus {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string;
  hero?: {
    title?: string;
    subtitle?: string;
    backgroundMediaUrl?: string;
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
    features?: Feature[];
  };
  visitAndContact?: {
    headline?: string;
    subtitle?: string;
    address?: string;
  };
  faq?: {
    headline?: string;
    faqs?: FAQ[];
  };
}

export default function CampusPage() {
  const firestore = useFirestore();
  const params = useParams();
  const slug = params.campusId as string;

  const [campus, setCampus] = useState<Campus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const campusQuery = useMemoFirebase(() => {
    if (!firestore || !slug) return null;
    return query(collection(firestore, 'campuses'), where('slug', '==', slug));
  }, [firestore, slug]);

  useEffect(() => {
    if (!campusQuery) {
      if(slug) setIsLoading(true);
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
  }, [campusQuery, slug]);

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="container py-8">
        <div className="relative h-[40vh] min-h-[300px] w-full overflow-hidden">
            {isLoading ? ( <Skeleton className="h-full w-full" /> ) : (
              (campus?.hero?.backgroundMediaUrl || campus?.imageUrl) && (
                <Image src={campus.hero?.backgroundMediaUrl || campus.imageUrl!} alt={campus.hero?.title || campus.name || "Campus background"} fill className="object-cover" priority />
              )
            )}
            <div className="absolute inset-0 bg-black/50" />
            <div className="relative z-10 flex h-full flex-col items-center justify-center text-center text-white p-4">
                {isLoading ? ( <div className="w-full max-w-3xl space-y-4"><Skeleton className="h-12 w-3/4 mx-auto bg-gray-400/50" /></div> ) : (
                <h1 className="text-2xl font-normal tracking-tighter sm:text-3xl md:text-4xl font-headline text-white">
                    {campus?.hero?.title || campus?.name || "Campus Details"}
                </h1>
                )}
            </div>
        </div>
      </section>

      {/* Campus Description Section */}
      {!isLoading && (campus?.campusDescription?.headline || campus?.campusDescription?.body) && (
        <section className="py-12 pt-0 md:pt-12">
          <div className="container px-4 md:px-6">
            <Card>
              <CardHeader><CardTitle>{campus.campusDescription.headline}</CardTitle></CardHeader>
              <CardContent><p className="text-muted-foreground whitespace-pre-wrap">{campus.campusDescription.body}</p></CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* Academic Offering Section */}
      <section className="py-12">
        <div className="container px-4 md:px-6">
          {isLoading ? (
            <div className="text-center space-y-4">
              <Skeleton className="h-10 w-1/2 mx-auto" />
              <Skeleton className="h-6 w-3/4 mx-auto" />
            </div>
          ) : (campus?.academicOffering?.headline || campus?.academicOffering?.subtitle) && (
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">{campus.academicOffering.headline}</h2>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed mt-4">
                {campus.academicOffering.subtitle}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Campus Experience Section */}
      <section className="py-12 bg-muted">
        <div className="container px-4 md:px-6">
          {isLoading ? (
            <div>
              <Skeleton className="h-10 w-1/2 mx-auto mb-12" />
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="space-y-4"><Skeleton className="aspect-video w-full" /><Skeleton className="h-6 w-3/4" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-5/6" /></div>
                ))}
              </div>
            </div>
          ) : campus?.campusExperience?.features && campus.campusExperience.features.length > 0 && (
            <>
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">{campus.campusExperience.headline}</h2>
              </div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {campus.campusExperience.features.map((feature) => (
                  <Card key={feature.id} className="flex flex-col">
                    {feature.mediaUrl && (
                      <div className="relative aspect-video w-full overflow-hidden rounded-t-lg">
                        <Image src={feature.mediaUrl} alt={feature.name} fill className="object-cover" />
                      </div>
                    )}
                    <div className="flex-1 p-6">
                      <CardTitle className="mb-2">{feature.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Visit and Contact Section */}
      <section className="py-12">
        <div className="container px-4 md:px-6">
           {isLoading ? (
            <div className="text-center space-y-4">
              <Skeleton className="h-10 w-1/2 mx-auto" />
              <Skeleton className="h-6 w-3/4 mx-auto" />
              <Skeleton className="h-5 w-1/3 mx-auto mt-2" />
            </div>
          ) : (campus?.visitAndContact?.headline || campus?.visitAndContact?.address) && (
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">{campus.visitAndContact.headline}</h2>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl/relaxed mt-4">{campus.visitAndContact.subtitle}</p>
              <p className="mt-6 font-semibold whitespace-pre-wrap">{campus.visitAndContact.address}</p>
            </div>
          )}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12 bg-muted">
        <div className="container px-4 md:px-6">
          {isLoading ? (
            <div>
              <Skeleton className="h-10 w-1/2 mx-auto mb-12" />
              <div className="space-y-4 max-w-3xl mx-auto">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            </div>
          ) : campus?.faq?.faqs && campus.faq.faqs.length > 0 && (
            <>
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">{campus.faq.headline || 'Frequently Asked Questions'}</h2>
              </div>
              <Accordion type="single" collapsible className="w-full max-w-3xl mx-auto">
                {campus.faq.faqs.map((faqItem) => (
                  <AccordionItem key={faqItem.id} value={faqItem.id}>
                    <AccordionTrigger className="text-left">{faqItem.question}</AccordionTrigger>
                    <AccordionContent className="whitespace-pre-wrap">{faqItem.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </>
          )}
        </div>
      </section>
    </div>
  );
}