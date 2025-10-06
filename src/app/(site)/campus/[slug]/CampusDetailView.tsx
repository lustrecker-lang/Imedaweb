

'use client';

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { useFirestore, useMemoFirebase, useCollection, addDocumentNonBlocking } from "@/firebase";
import { collection, serverTimestamp } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Building, GraduationCap, MapPin, Sparkles, HelpCircle, Phone, Mail, ChevronRight, Download, CheckCircle, Loader2 } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";


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
  bannerSection?: {
      title?: string;
      text?: string;
      mediaUrl?: string;
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

const MediaPreview = ({ url, alt }: { url: string, alt: string }) => {
    if (isVideoUrl(url)) {
        return (
            <video src={url} autoPlay loop muted playsInline className="absolute inset-0 h-full w-full object-cover"/>
        );
    }
    return (
        <Image src={url} alt={alt} fill className="object-cover" />
    );
}

export default function CampusDetailView({ campus, categories, themes }: CampusDetailViewProps) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [catalogEmail, setCatalogEmail] = useState('');
    const [isEmailValid, setIsEmailValid] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasSubmitted, setHasSubmitted] = useState(false);

    useEffect(() => {
        const emailSchema = z.string().email();
        const result = emailSchema.safeParse(catalogEmail);
        setIsEmailValid(result.success);
    }, [catalogEmail]);

    const handleCatalogSubmit = async () => {
        if (!isEmailValid || isSubmitting) return;
        setIsSubmitting(true);
        try {
        if (firestore) {
            await addDocumentNonBlocking(collection(firestore, 'leads'), {
                email: catalogEmail,
                leadType: 'Catalog Download',
                fullName: 'Catalog Lead (Campus Page)',
                message: `Catalog download request from campus page: ${campus?.name}`,
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
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not process your catalog download request.'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResetForm = () => {
        setHasSubmitted(false);
        setCatalogEmail('');
    };

  if (!campus) {
    return <div className="container py-12 text-center text-muted-foreground">Campus not found.</div>
  }
  
  const isHeroVideo = isVideoUrl(campus.hero?.backgroundMediaUrl);
  const isBannerVideo = isVideoUrl(campus.bannerSection?.mediaUrl);

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
                <Card className="relative min-h-[40vh] w-full flex items-end justify-start text-white text-left p-6 md:p-8 lg:p-12 overflow-hidden rounded-lg">
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
      <main className="container pt-12 pb-16 lg:pb-20">

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
                                    <ul className="pt-2 pl-4 space-y-2">
                                        {category.themes.map(theme => (
                                            <li key={theme.id}>
                                                <Link href={`/courses?themeId=${theme.id}`} className="flex items-center text-primary hover:underline transition-colors">
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
                                         <div className="relative w-[150px] h-[100px] shrink-0 rounded-md overflow-hidden hidden sm:block">
                                            <MediaPreview url={feature.mediaUrl} alt={feature.name} />
                                         </div>
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

                {/* Banner Section */}
                {campus.bannerSection && (campus.bannerSection.title || campus.bannerSection.text || campus.bannerSection.mediaUrl) && (
                    <section id="banner">
                        <Card className="overflow-hidden">
                            <div className="grid grid-cols-1 md:grid-cols-2">
                                <div className="relative aspect-video md:aspect-auto h-full min-h-[250px] w-full">
                                    {campus.bannerSection.mediaUrl && <MediaPreview url={campus.bannerSection.mediaUrl} alt={campus.bannerSection.title || "Banner"} />}
                                </div>
                                <div className="p-6 flex flex-col justify-center">
                                    <h3 className="font-headline text-2xl font-normal">{campus.bannerSection.title}</h3>
                                    <p className="mt-2 text-sm text-muted-foreground">{campus.bannerSection.text}</p>
                                </div>
                            </div>
                        </Card>
                    </section>
                )}

                {/* FAQ */}
                {campus.faq?.faqs && campus.faq.faqs.length > 0 && (
                    <section id="faq">
                        <div className="max-w-2xl">
                           <h2 className="text-xl font-normal tracking-tighter sm:text-2xl font-headline">{campus.faq.headline || "Frequently Asked Questions"}</h2>
                        </div>
                        <Accordion type="single" collapsible className="w-full mt-8">
                            {campus.faq.faqs.map(faq => (
                                 <AccordionItem value={faq.id} key={faq.id}>
                                    <AccordionTrigger className="text-left font-normal text-sm">
                                        {faq.question}
                                    </AccordionTrigger>
                                    <AccordionContent className="text-sm text-muted-foreground whitespace-pre-wrap">
                                        {faq.answer}
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </section>
                )}

            </div>
            <aside className="md:col-span-4 space-y-8 md:sticky top-24 self-start">
                 {/* Contact Person */}
                {campus.visitAndContact?.name && (
                     <section id="contact-person">
                        <Card>
                             <CardContent className="pt-6">
                                <div className="text-left">
                                    {campus.visitAndContact.imageUrl && (
                                        <div className="relative h-24 w-24 rounded-md mb-4 overflow-hidden">
                                            <Image src={campus.visitAndContact.imageUrl} alt={campus.visitAndContact.name} fill className="object-cover" />
                                        </div>
                                    )}
                                    <h3 className="font-headline font-normal text-xl">{campus.visitAndContact.name}</h3>
                                    <p className="text-sm text-primary/80">{campus.visitAndContact.title}</p>
                                    {campus.visitAndContact.description && <p className="text-sm text-muted-foreground mt-3">{campus.visitAndContact.description}</p>}
                                    <div className="flex flex-col items-start gap-3 mt-4">
                                        {campus.visitAndContact.phone && <a href={`tel:${campus.visitAndContact.phone}`} className="flex items-center gap-2 text-base text-primary hover:underline"><Phone size={16} /><span>{campus.visitAndContact.phone}</span></a>}
                                        {campus.visitAndContact.email && <a href={`mailto:${campus.visitAndContact.email}`} className="flex items-center gap-2 text-base text-primary hover:underline"><Mail size={16} /><span>{campus.visitAndContact.email}</span></a>}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </section>
                )}

                {/* Download Catalog */}
                <section id="download-catalog">
                    <Card>
                        <CardContent className="pt-6">
                            {hasSubmitted ? (
                                <div className="flex flex-col items-center justify-center text-center space-y-4 py-8">
                                    <CheckCircle className="w-12 h-12 text-green-500 mb-2" />
                                    <h3 className="font-headline font-normal text-xl">Merci!</h3>
                                    <p className="text-muted-foreground mt-1 text-sm">Votre téléchargement a commencé.</p>
                                    <Button variant="outline" onClick={handleResetForm} className="mt-4 w-full">Fermer</Button>
                                </div>
                            ) : (
                                <>
                                    <h3 className="font-headline font-normal text-lg">Télécharger le catalogue 2025-26</h3>
                                    <div className="flex flex-col sm:flex-row items-center gap-2 mt-4">
                                        <Input
                                            type="email"
                                            placeholder="Votre adresse email"
                                            className="w-full"
                                            value={catalogEmail}
                                            onChange={(e) => setCatalogEmail(e.target.value)}
                                            disabled={isSubmitting}
                                        />
                                        <Button className="w-full sm:w-auto" disabled={!isEmailValid || isSubmitting} onClick={handleCatalogSubmit}>
                                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                                            Télécharger
                                        </Button>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </section>

                {/* Visit & Contact */}
                <section id="contact-info">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center text-xl font-headline font-normal">
                                {campus.visitAndContact?.headline || "Visit & Contact"}
                            </CardTitle>
                             {campus.visitAndContact?.subtitle && <CardDescription className="pt-2 text-sm">{campus.visitAndContact.subtitle}</CardDescription>}
                        </CardHeader>
                        <CardContent>
                           <p className="text-sm text-muted-foreground whitespace-pre-wrap">{campus.visitAndContact?.address}</p>
                        </CardContent>
                    </Card>
                </section>
            </aside>
        </div>
      </main>
    </div>
  );
}
