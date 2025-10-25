
// src/app/(site)/partenariats/PartnershipsView.tsx
'use client';

import Image from "next/image";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Download, CheckCircle, Loader2 } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Stepper, Step } from "@/components/ui/stepper";
import { ContactForm } from "@/components/contact-form";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

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

interface PartnershipsViewProps {
  pageData: Page | null;
}

const WhyUsCard = ({ section }: { section: Section }) => (
    <div className="flex flex-row md:flex-col items-center md:items-start gap-4 md:gap-0 p-4 border rounded-lg bg-card md:bg-transparent md:border-0 md:p-0">
        {section.imageUrl && (
            <div className="relative aspect-square w-16 h-16 md:w-full md:h-auto md:aspect-video shrink-0 overflow-hidden rounded-md">
                <Image
                    src={section.imageUrl}
                    alt={section.title}
                    fill
                    className="object-cover"
                />
            </div>
        )}
        <div className="flex-1 md:mt-4">
            <h3 className="font-headline text-lg font-normal">{section.title}</h3>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-3">{section.content}</p>
        </div>
    </div>
);

export default function PartnershipsView({ pageData }: PartnershipsViewProps) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [catalogEmail, setCatalogEmail] = useState('');
    const [isEmailValid, setIsEmailValid] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const [contactFormSubmitted, setContactFormSubmitted] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [isContactSheetOpen, setIsContactSheetOpen] = useState(false);

    useEffect(() => {
        const checkIsMobile = () => setIsMobile(window.innerWidth < 768);
        checkIsMobile();
        window.addEventListener('resize', checkIsMobile);
        return () => window.removeEventListener('resize', checkIsMobile);
    }, []);

    useEffect(() => {
        const emailSchema = z.string().email();
        const result = emailSchema.safeParse(catalogEmail);
        setIsEmailValid(result.success);
    }, [catalogEmail]);


  const heroSection = pageData?.sections.find(s => s.id === 'hero');
  const whyUsHeader = pageData?.sections.find(s => s.id === 'why-us-header');
  const whyUsCards = pageData?.sections.filter(s => s.id.startsWith('why-us-') && s.id !== 'why-us-header') || [];
  const specialisationsHeader = pageData?.sections.find(s => s.id === 'specialisations-header');
  const specialisations = pageData?.sections.filter(s => s.id.startsWith('spec-')) || [];
  const howWeWorkHeader = pageData?.sections.find(s => s.id === 'how-we-work-header');
  const howWeWorkSteps = pageData?.sections.filter(s => s.id.startsWith('step-')) || [];
  const formatCards = pageData?.sections.filter(s => s.id.startsWith('format-')) || [];
  const catalogSection = pageData?.sections.find(s => s.id === 'catalog-download');
  
  const heroImageUrl = heroSection?.imageUrl;

  const handleCatalogSubmit = async () => {
    if (!isEmailValid || isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (firestore) {
        await addDocumentNonBlocking(collection(firestore, 'leads'), {
            email: catalogEmail,
            leadType: 'Catalog Download',
            fullName: 'Catalog Lead (Partnerships Page)',
            message: 'Catalog Download Request from Partnerships page.',
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
      toast({ variant: 'destructive', title: "Error", description: "Could not process your request." });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleResetForm = () => {
    setHasSubmitted(false);
    setCatalogEmail('');
  };


  return (
    <div className="flex flex-col">
      <section className="container py-8">
        <div className="relative min-h-[500px] md:min-h-[450px] w-full overflow-hidden rounded-lg">
            {!pageData ? (
              <Skeleton className="h-full w-full" />
            ) : (
              heroImageUrl && (
                <Image
                    src={heroImageUrl}
                    alt={heroSection?.title || "Partenariats background"}
                    fill
                    className="object-cover"
                    priority
                />
              )
            )}
            <div className="absolute inset-0 bg-black/60" />
            <div className="relative z-10 h-full flex items-center justify-center p-4 md:p-6">
                <div className="grid md:grid-cols-2 gap-8 items-center w-full max-w-6xl">
                    <div className="text-white text-center md:text-left">
                        {pageData ? (
                            <>
                                <h1 className="text-3xl font-normal tracking-tighter sm:text-4xl md:text-5xl font-headline">
                                {heroSection?.title || "Partenariats d'entreprise"}
                                </h1>
                                <p className="mx-auto mt-4 max-w-[500px] text-gray-200 md:text-lg">
                                {heroSection?.content || "Collaborez avec nous pour un succès mutuel."}
                                </p>
                                {isMobile && (
                                    <div className="mt-6">
                                        <Sheet open={isContactSheetOpen} onOpenChange={setIsContactSheetOpen}>
                                            <SheetTrigger asChild>
                                                <Button size="lg">Contactez-nous</Button>
                                            </SheetTrigger>
                                            <SheetContent side="bottom" className="h-[90vh] flex flex-col">
                                                 <div className="overflow-y-auto p-2">
                                                    <ContactForm onFormSubmit={() => setIsContactSheetOpen(false)} showHeader={true} />
                                                 </div>
                                            </SheetContent>
                                        </Sheet>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="w-full max-w-lg space-y-4">
                                <Skeleton className="h-12 w-3/4 bg-gray-400/50" />
                                <Skeleton className="h-6 w-full bg-gray-400/50" />
                            </div>
                        )}
                    </div>
                     {!isMobile && (
                        <div className="bg-card text-card-foreground p-6 rounded-lg shadow-xl">
                            <ContactForm onFormSubmit={() => setContactFormSubmitted(true)} showHeader={false} />
                        </div>
                    )}
                </div>
            </div>
        </div>
      </section>

        <section className="py-16 md:py-24">
            <div className="container px-4 md:px-6 space-y-16">
                 {/* Why Us Section */}
                {whyUsHeader && (
                    <div className="text-center max-w-3xl mx-auto">
                        <h2 className="text-3xl font-normal tracking-tighter sm:text-4xl font-headline">{whyUsHeader.title}</h2>
                        <p className="mt-4 text-muted-foreground md:text-lg">{whyUsHeader.content}</p>
                    </div>
                )}
                {whyUsCards.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 mt-12">
                        {whyUsCards.map(card => <WhyUsCard key={card.id} section={card} />)}
                    </div>
                )}
            </div>
        </section>

         {/* Specialisations Section */}
        {specialisationsHeader && (
            <section className="py-16 md:py-24 bg-muted/30">
                <div className="container px-4 md:px-6">
                    <div className="text-center max-w-3xl mx-auto">
                        <h2 className="text-3xl font-normal tracking-tighter sm:text-4xl font-headline">{specialisationsHeader.title}</h2>
                        <p className="mt-4 text-muted-foreground md:text-lg">{specialisationsHeader.content}</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mt-12">
                        {specialisations.map(spec => (
                            <div key={spec.id}>
                                <h3 className="font-headline font-normal text-lg">{spec.title}</h3>
                                <p className="text-sm text-muted-foreground mt-1">{spec.content}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        )}

        {/* How We Work Section */}
        {howWeWorkHeader && (
            <section className="py-16 md:py-24">
                <div className="container px-4 md:px-6">
                     <div className="text-center max-w-3xl mx-auto">
                        <h2 className="text-3xl font-normal tracking-tighter sm:text-4xl font-headline">{howWeWorkHeader.title}</h2>
                        <p className="mt-4 text-muted-foreground md:text-lg">{howWeWorkHeader.content}</p>
                    </div>
                    <div className="mt-12 max-w-4xl mx-auto">
                        <Stepper>
                            {howWeWorkSteps.map((step, index) => (
                                <Step key={step.id} step={index + 1} isLast={index === howWeWorkSteps.length - 1}>
                                    <h3 className="font-headline font-normal text-lg">{step.title}</h3>
                                    <p className="text-sm text-muted-foreground">{step.content}</p>
                                </Step>
                            ))}
                        </Stepper>
                    </div>
                </div>
            </section>
        )}

        {/* Format Section */}
        {formatCards.length > 0 && (
            <section className="py-16 md:py-24 bg-muted/30">
                 <div className="container px-4 md:px-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {formatCards.map(card => (
                            <Card key={card.id} className="overflow-hidden group">
                                 <div className="relative aspect-video w-full">
                                    <Image
                                        src={card.imageUrl || `https://picsum.photos/seed/${card.id}/800/450`}
                                        alt={card.title}
                                        fill
                                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                                    />
                                </div>
                                <div className="p-6">
                                    <h3 className="font-headline font-normal text-xl">{card.title}</h3>
                                    <p className="text-sm text-muted-foreground mt-2">{card.content}</p>
                                </div>
                            </Card>
                        ))}
                    </div>
                 </div>
            </section>
        )}
        
        {/* Catalog Download Banner */}
        {catalogSection && (
        <section className="py-16 md:py-24">
            <div className="container">
                <Card className="overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-2 items-center">
                        <div className="relative aspect-video h-full min-h-[250px] md:min-h-0 order-1 md:order-2">
                            <Image
                                src={catalogSection.imageUrl || "https://picsum.photos/seed/catalog-banner/800/600"}
                                alt={catalogSection.title}
                                fill
                                className="object-cover"
                            />
                        </div>
                        <div className="p-6 md:p-10 text-left order-2 md:order-1">
                            {hasSubmitted ? (
                                <div className="flex flex-col items-center justify-center text-center space-y-4">
                                <CheckCircle className="w-12 h-12 text-green-500 mb-2" />
                                <h3 className="font-headline font-normal text-2xl">Merci!</h3>
                                <p className="text-muted-foreground mt-1 text-sm">Votre téléchargement a commencé.</p>
                                <Button variant="outline" onClick={handleResetForm} className="mt-4">Fermer</Button>
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
                                        onChange={e => setCatalogEmail(e.target.value)}
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

    </div>
  );
}
