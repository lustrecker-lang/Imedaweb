
"use client";

import { Check, CalendarOff, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import { LeadCaptureDialog } from "./LeadCaptureDialog";
import { cn } from "@/lib/utils";

interface PremiumInfoSectionProps {
    ctaHref: string;
    leadCaptureSlug: string;
}

export function PremiumInfoSection({ ctaHref, leadCaptureSlug }: PremiumInfoSectionProps) {
    return (
        <section className="py-16 md:py-24 bg-background">
            <div className="container px-4 md:px-6">
                {/* 1. Section Header (Social Proof) */}
                <div className="text-center mb-12 space-y-4">
                    <h2 className="text-3xl font-normal tracking-tighter sm:text-4xl md:text-5xl font-headline">
                        Une communauté de décideurs confirmés
                    </h2>
                    <p className="text-lg text-muted-foreground font-medium tracking-wide">
                        220+ PROFESSIONNELS CERTIFIÉS À TRAVERS L’AFRIQUE FRANCOPHONE.
                    </p>
                </div>

                {/* 2. The Grid Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">

                    {/* Left Card: The Product & Investment */}
                    <Card className="flex flex-col border border-border shadow-sm rounded-none h-full hover:shadow-md transition-shadow duration-300">
                        <CardHeader className="space-y-4 pb-6 border-b bg-muted/20">
                            <CardTitle className="text-2xl md:text-3xl font-headline font-normal">Programme intensif exécutif - 2 semaines</CardTitle>
                            <CardDescription className="text-base text-muted-foreground leading-relaxed">
                                Un parcours structuré pour renforcer la prise de décision, le leadership et l’efficacité managériale.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 pt-8 space-y-8">

                            {/* Pricing Blocks */}
                            <div className="grid sm:grid-cols-2 gap-6">
                                <div className="space-y-2 p-4 bg-muted/30 border border-transparent hover:border-border transition-colors">
                                    <h4 className="font-semibold text-lg">Format En Ligne</h4>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-2xl font-bold font-headline">USD 4,520</span>
                                        <span className="text-sm text-muted-foreground">/ participant</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">Flexibilité totale. Compatible avec les agendas exécutifs</p>
                                </div>

                                <div className="space-y-2 p-4 bg-primary/5 border border-primary/10">
                                    <h4 className="font-semibold text-lg text-primary">Format Présentiel</h4>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-sm text-muted-foreground">À partir de</span>
                                        <span className="text-2xl font-bold font-headline text-primary">USD 7,990</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">Minimum 2 participants</p>
                                </div>
                            </div>

                            {/* Benefits List */}
                            <div className="space-y-3">
                                <p className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Inclus dans tous les programmes</p>
                                <ul className="space-y-3">
                                    {[
                                        "Certification officielle IMEDA",
                                        "Supports exclusifs et études de cas sectoriels",
                                        "Accompagnement post-formation personnalisé (3 mois)"
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-start gap-3 text-sm">
                                            <Check className="h-5 w-5 text-green-600 shrink-0" />
                                            <span className="text-muted-foreground">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Right Card: The Philosophy (Sur Mesure) */}
                    <Card className="flex flex-col border border-border shadow-sm rounded-none h-full bg-slate-900 text-slate-50 relative overflow-hidden group">
                        <CardHeader className="space-y-4 pb-6 relative z-10">
                            <CardTitle className="text-2xl md:text-3xl font-headline font-normal text-white">L’excellence sur mesure</CardTitle>
                        </CardHeader>

                        <CardContent className="flex-1 pt-2 space-y-10 relative z-10">
                            <div className="space-y-2">
                                <h4 className="text-xl font-semibold text-white">Aucun calendrier imposé</h4>
                                <p className="text-slate-300 text-sm leading-relaxed">
                                    La formation s’adapte à vos contraintes opérationnelles, et non l’inverse.
                                </p>
                            </div>

                            <div className="grid gap-8">
                                <div className="space-y-2">
                                    <h5 className="text-xl font-semibold text-white">Démarrage à la demande</h5>
                                    <p className="text-sm text-slate-400 leading-relaxed">Le programme commence lorsque votre équipe est prête à s’engager.</p>
                                </div>
                                <div className="space-y-2">
                                    <h5 className="text-xl font-semibold text-white">Contenu personnalisé</h5>
                                    <p className="text-sm text-slate-400 leading-relaxed">Chaque parcours est conçu selon les défis spécifiques de votre organisation, de votre secteur et de votre marché.</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                </div>
            </div>
        </section>
    );
}
