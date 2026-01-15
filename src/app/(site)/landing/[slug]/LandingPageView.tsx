'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { LeadCaptureDialog } from '@/components/landing/LeadCaptureDialog';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useMemo, useEffect } from 'react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CheckCircle, Download, Loader2, MessageCircle } from "lucide-react";
import { useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { z } from 'zod';
import { PremiumInfoSection } from '@/components/landing/PremiumInfoSection';

// Interfaces (Redefined for Client Safety)
interface Section { id: string; title: string; content: string; imageUrl?: string; }
interface Page { id: string; title: string; sections: Section[]; imageUrl?: string; } // Added imageUrl here just in case heroData has it at top level or we access it from section
interface Reference { id: string; name: string; logoUrl: string; }

interface LandingPageProps {
    landingPage: {
        id: string;
        slug: string;
        headline: string;
        description: string;
        cta: {
            text: string;
            type?: 'plp' | 'pdp';
            themeId?: string;
            categoryId?: string;
            courseId?: string;
        };
    };
    heroData: Page | null;
    referencesData: Reference[];
    featuresData: Page | null;
    catalogData: Page | null;
}

export default function LandingPageView({ landingPage, heroData, referencesData, featuresData, catalogData }: LandingPageProps) {
    const firestore = useFirestore();
    const [catalogEmail, setCatalogEmail] = useState('');
    const [catalogPhone, setCatalogPhone] = useState('');
    const [isEmailValid, setIsEmailValid] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasSubmitted, setHasSubmitted] = useState(false);

    // Build CTA URL
    let ctaHref = '/courses';
    if (landingPage.cta.type === 'pdp' && landingPage.cta.courseId) {
        ctaHref = `/courses/${landingPage.cta.courseId}`;
    } else {
        const ctaParams = new URLSearchParams();
        if (landingPage.cta.themeId) {
            ctaParams.set('themeId', landingPage.cta.themeId);
        }
        if (landingPage.cta.categoryId) {
            ctaParams.set('categoryId', landingPage.cta.categoryId);
        }
        if (ctaParams.toString()) {
            ctaHref += `?${ctaParams.toString()}`;
        }
    }

    // Helper for Hero Image
    const heroSection = heroData?.sections.find(s => s.id === 'hero');
    const heroImageUrl = heroSection?.imageUrl;

    // Helper to check for video extensions
    const isVideoUrl = (url?: string | null) => {
        if (!url) return false;
        const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov'];
        try {
            const pathname = new URL(url).pathname.split('?')[0];
            return videoExtensions.some(ext => pathname.toLowerCase().endsWith(ext));
        } catch (e) { return false; }
    };

    const isHeroVideo = isVideoUrl(heroImageUrl);

    // Helper for Features
    const featureSections = useMemo(() => {
        if (!featuresData) return [];
        const sections = [];
        for (let i = 1; i <= 3; i++) {
            const section = featuresData?.sections.find(s => s.id === `feature-${i}`);
            if (section) sections.push(section);
        }
        return sections;
    }, [featuresData]);

    const featuresSectionHeader = featuresData?.sections.find(s => s.id === 'features');
    const catalogSection = catalogData?.sections.find(s => s.id === 'catalog-download');

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
                    phone: catalogPhone,
                    leadType: 'Catalog Download',
                    fullName: 'Catalog Lead (Landing Page)',
                    message: `Catalog Download Request from landing page: ${landingPage.slug}`,
                    landingPageId: landingPage.id,
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
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResetForm = () => {
        setHasSubmitted(false);
        setCatalogEmail('');
        setCatalogPhone('');
    };


    return (
        <div className="flex flex-col w-full">
            {/* 1. Hero Section (Split Layout) */}
            <section className="bg-background py-16 md:py-24">
                <div className="container px-4 md:px-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        <div className="flex flex-col items-start text-left space-y-6">
                            <h1 className="text-4xl font-normal tracking-tighter sm:text-5xl md:text-6xl font-headline">
                                {landingPage.headline}
                            </h1>
                            <p className="text-lg text-muted-foreground">
                                {landingPage.description}
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                                <Button size="lg" className="text-lg px-8 py-6 rounded-none" asChild>
                                    <Link href={ctaHref}>
                                        {landingPage.cta.text}
                                    </Link>
                                </Button>
                                <LeadCaptureDialog landingPageSlug={landingPage.slug}>
                                    <Button
                                        size="lg"
                                        variant="outline"
                                        className="text-lg px-8 py-6 rounded-none border-2"
                                    >
                                        <span className="flex items-center gap-2">
                                            <MessageCircle className="w-5 h-5" />
                                            Parler avec nous
                                        </span>
                                    </Button>
                                </LeadCaptureDialog>
                            </div>
                        </div>
                        <div className="relative aspect-square md:aspect-[4/3] w-full overflow-hidden">
                            {heroImageUrl ? (
                                isHeroVideo ? (
                                    <video
                                        src={heroImageUrl}
                                        autoPlay
                                        loop
                                        muted
                                        playsInline
                                        className="absolute inset-0 h-full w-full object-cover"
                                    />
                                ) : (
                                    <Image
                                        src={heroImageUrl}
                                        alt="Hero Image"
                                        fill
                                        className="object-cover"
                                        priority
                                    />
                                )
                            ) : (
                                <div className="w-full h-full bg-muted flex items-center justify-center">
                                    <span className="text-muted-foreground">No Image</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* 2. Companies Carousel & Authority Banner */}
            {referencesData && referencesData.length > 0 && (
                <section className="py-12 bg-muted/30">
                    <div className="container px-4 md:px-6">
                        {/* Carousel (No Title) */}
                        <div className="relative w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,white_10%,white_90%,transparent)] mb-16">
                            <div className="flex w-max animate-scroll">
                                {[...referencesData, ...referencesData].map((reference, index) => (
                                    <div key={`${reference.id}-${index}`} className="flex items-center justify-center h-20 w-48 px-8">
                                        <Image
                                            src={reference.logoUrl}
                                            alt={reference.name}
                                            width={120}
                                            height={40}
                                            className="max-h-14 w-auto object-contain grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Authority Statement Box (Below Carousel) */}
                        <div className="max-w-4xl mx-auto">
                            <div className="bg-background/80 backdrop-blur-sm border border-border shadow-sm p-8 md:p-12 text-center">
                                <h2 className="text-2xl md:text-3xl font-headline font-normal mb-6">
                                    La référence en formation exécutive pour l’élite économique d’Afrique francophone
                                </h2>
                                <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                                    IMEDA accompagne les dirigeants et cadres supérieurs des secteurs stratégique pétrolier, minier, bancaire et portuaire dans le renforcement de leur leadership et de leur performance.
                                </p>
                                <p className="font-medium text-primary tracking-wide uppercase text-sm">
                                    Programmes intensifs. Sur mesure. À impact mesurable.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* 2.5 Premium Information Section */}
            <PremiumInfoSection
                ctaHref={ctaHref}
                leadCaptureSlug={landingPage.slug}
            />

            {/* 3. Catalogue Download Section */}
            {catalogSection && (
                <section className="py-16 md:py-24">
                    <div className="container px-4 md:px-6">
                        <div className="mx-auto max-w-5xl">
                            <Card className="overflow-hidden shadow-lg border-0 bg-slate-900 text-white rounded-none">
                                <div className="grid grid-cols-1 md:grid-cols-2 items-center">
                                    <div className="relative aspect-video h-full min-h-[300px] md:min-h-0 order-1 md:order-2">
                                        {catalogSection.imageUrl && (
                                            <Image
                                                src={catalogSection.imageUrl}
                                                alt={catalogSection.title || "Download Catalog"}
                                                fill
                                                className="object-cover opacity-90"
                                            />
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-l from-slate-900 via-slate-900/20 to-transparent md:bg-gradient-to-r md:from-slate-900 md:via-transparent md:to-transparent" />
                                    </div>
                                    <div className="p-8 md:p-12 text-left order-2 md:order-1 relative z-10">
                                        {hasSubmitted ? (
                                            <div className="flex flex-col items-center justify-center text-center space-y-6 py-8">
                                                <div className="rounded-full bg-green-500/20 p-4">
                                                    <CheckCircle className="w-12 h-12 text-green-500" />
                                                </div>
                                                <div>
                                                    <h3 className="font-headline font-normal text-3xl mb-2">Merci!</h3>
                                                    <p className="text-slate-300">
                                                        Votre téléchargement a commencé.
                                                    </p>
                                                </div>
                                                <Button variant="outline" onClick={handleResetForm} className="mt-4 border-slate-700 hover:bg-slate-800 text-white hover:text-white rounded-none">
                                                    Fermer
                                                </Button>
                                            </div>
                                        ) : (
                                            <>
                                                <h3 className="font-headline font-normal text-3xl md:text-4xl mb-4">
                                                    {catalogSection.title}
                                                </h3>
                                                <p className="text-slate-300 text-lg mb-8 leading-relaxed">
                                                    {catalogSection.content}
                                                </p>
                                                <div className="space-y-4">
                                                    <Input
                                                        type="email"
                                                        placeholder="Votre adresse email professionnelle"
                                                        className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 h-12 rounded-none"
                                                        value={catalogEmail}
                                                        onChange={e => setCatalogEmail(e.target.value)}
                                                        disabled={isSubmitting}
                                                    />
                                                    <Input
                                                        type="tel"
                                                        placeholder="Numéro de téléphone"
                                                        className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 h-12 rounded-none"
                                                        value={catalogPhone}
                                                        onChange={e => setCatalogPhone(e.target.value)}
                                                        disabled={isSubmitting}
                                                    />
                                                    <Button
                                                        className="w-full h-12 text-lg font-medium bg-white text-slate-900 hover:bg-gray-100 rounded-none"
                                                        disabled={!isEmailValid || isSubmitting}
                                                        onClick={handleCatalogSubmit}
                                                    >
                                                        {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Download className="mr-2 h-5 w-5" />}
                                                        Télécharger le catalogue
                                                    </Button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>
                </section>
            )}

            {/* 3.5. Profil des Participants */}
            <section className="py-16 md:py-24 bg-background">
                <div className="container px-4 md:px-6">
                    <div className="flex flex-col items-center text-center mb-12">
                        <h2 className="text-3xl font-normal tracking-tighter sm:text-4xl md:text-5xl font-headline mb-4">
                            Profil des Participants
                        </h2>
                        <p className="text-muted-foreground text-lg max-w-2xl">
                            Rejoignez une communauté de professionnels expérimentés venus de toute l'Afrique francophone
                        </p>
                    </div>

                    <div className="grid gap-8 md:grid-cols-3">
                        {/* Work Experience Card - Donut Chart */}
                        <Card className="border-none shadow-sm bg-primary text-primary-foreground overflow-hidden rounded-none">
                            <CardHeader>
                                <CardTitle className="font-headline font-normal text-xl text-primary-foreground">Expérience Professionnelle</CardTitle>
                                <CardDescription className="text-primary-foreground/80">Années d'expérience des participants</CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-col items-center">
                                <div className="relative w-48 h-48 mb-6">
                                    <svg viewBox="0 0 100 100" className="transform -rotate-90">
                                        {/* Background circle */}
                                        <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="20" className="text-primary-foreground/20" />

                                        {/* 0-10 years segment (17%) */}
                                        <circle
                                            cx="50"
                                            cy="50"
                                            r="40"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="20"
                                            strokeDasharray="42.73 251.32"
                                            strokeDashoffset="0"
                                            className="text-primary-foreground/60 transition-all duration-500"
                                        />

                                        {/* 10-15 years segment (47%) - largest */}
                                        <circle
                                            cx="50"
                                            cy="50"
                                            r="40"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="20"
                                            strokeDasharray="118.16 251.32"
                                            strokeDashoffset="-42.73"
                                            className="text-primary-foreground transition-all duration-500"
                                        />

                                        {/* 15+ years segment (36%) */}
                                        <circle
                                            cx="50"
                                            cy="50"
                                            r="40"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="20"
                                            strokeDasharray="90.43 251.32"
                                            strokeDashoffset="-160.89"
                                            className="text-primary-foreground/80 transition-all duration-500"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="text-center">
                                            <div className="text-3xl font-bold text-primary-foreground">100%</div>
                                            <div className="text-xs text-primary-foreground/80">Participants</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2 w-full">
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 bg-primary-foreground/60 rounded-none"></div>
                                            <span className="text-primary-foreground/90">0-10 ans</span>
                                        </div>
                                        <span className="font-medium text-primary-foreground">17%</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 bg-primary-foreground rounded-none"></div>
                                            <span className="text-primary-foreground/90">10-15 ans</span>
                                        </div>
                                        <span className="font-medium text-primary-foreground">47%</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 bg-primary-foreground/80 rounded-none"></div>
                                            <span className="text-primary-foreground/90">15+ ans</span>
                                        </div>
                                        <span className="font-medium text-primary-foreground">36%</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Industries Card */}
                        <Card className="border-none shadow-sm bg-primary text-primary-foreground overflow-hidden rounded-none">
                            <CardHeader>
                                <CardTitle className="font-headline font-normal text-xl text-primary-foreground">Secteurs d'Activité</CardTitle>
                                <CardDescription className="text-primary-foreground/80">Industries représentées</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4 text-sm">
                                    {[
                                        { name: 'Pétrole & Mines', value: 24 },
                                        { name: 'Banque & Finance', value: 20 },
                                        { name: 'Télécommunications', value: 16 },
                                        { name: 'Conseil', value: 14 },
                                        { name: 'Industrie', value: 12 },
                                        { name: 'Biens de Consommation', value: 10 },
                                        { name: 'Assurances', value: 4 }
                                    ].map((industry, idx) => (
                                        <div key={idx} className="flex items-center justify-between space-x-4">
                                            <span className="text-primary-foreground/90 flex-1">{industry.name}</span>
                                            <div className="flex items-center gap-2 flex-1">
                                                <div className="h-2 bg-primary-foreground/20 rounded-full overflow-hidden flex-1">
                                                    <div
                                                        className="h-full bg-primary-foreground transition-all duration-500 rounded-full"
                                                        style={{ width: `${industry.value * 4}%` }}
                                                    ></div>
                                                </div>
                                                <span className="font-medium text-xs w-8 text-right text-primary-foreground">{industry.value}%</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Geographic Origin Card */}
                        <Card className="border-none shadow-sm bg-primary text-primary-foreground overflow-hidden rounded-none">
                            <CardHeader>
                                <CardTitle className="font-headline font-normal text-xl text-primary-foreground">Origine Géographique</CardTitle>
                                <CardDescription className="text-primary-foreground/80">Pays d'origine des participants</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {[
                                        { country: 'Congo-Kinshasa', value: 30 },
                                        { country: 'Congo-Brazzaville', value: 26 },
                                        { country: 'Côte d\'Ivoire', value: 18 },
                                        { country: 'Cameroun', value: 12 },
                                        { country: 'Sénégal', value: 8 },
                                        { country: 'Autres pays', value: 6 }
                                    ].map((geo, idx) => (
                                        <div key={idx} className="space-y-1">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-primary-foreground/90">{geo.country}</span>
                                                <span className="font-medium text-primary-foreground">{geo.value}%</span>
                                            </div>
                                            <div className="h-2 bg-primary-foreground/20 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-primary-foreground transition-all duration-500 rounded-full"
                                                    style={{ width: `${geo.value}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            {/* 4. Excellence Académique (Features) */}
            <section className="py-16 md:py-24 bg-muted/20">
                <div className="container px-4 md:px-6">
                    <div className="flex flex-col items-center text-center mb-12">
                        <h2 className="text-3xl font-normal tracking-tighter sm:text-4xl md:text-5xl font-headline mb-4">{featuresSectionHeader?.title}</h2>
                        <p className="text-muted-foreground text-lg max-w-2xl">{featuresSectionHeader?.content}</p>
                    </div>
                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                        {featureSections.map((featureSection) => (
                            <Card key={featureSection.id} className="border-none shadow-sm hover:shadow-md transition-shadow duration-300 bg-white overflow-hidden group rounded-none">
                                <div className="relative aspect-video w-full overflow-hidden">
                                    {featureSection.imageUrl && (
                                        <Image
                                            src={featureSection.imageUrl}
                                            alt={featureSection.title}
                                            fill
                                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                    )}
                                </div>
                                <CardHeader>
                                    <CardTitle className="font-headline font-normal text-xl">{featureSection.title}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground leading-relaxed">{featureSection.content}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
