
'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where, orderBy } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Users, Target, CheckCircle, Award, ListTree, Banknote, Building, ChevronRight } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { CourseInquiryForm } from '@/components/course-inquiry-form';


interface Formation {
    id: string;
    name: string;
    formationId: string;
    themeId: string;
    objectifPedagogique?: string;
    preRequis?: string;
    publicConcerne?: string;
    methodesMobilisees?: string;
    moyensPedagogiques?: string;
    modalitesEvaluation?: string;
    prixAvecHebergement?: string;
    prixSansHebergement?: string;
    format?: string;
}

interface Theme {
    id: string;
    name: string;
}

interface Module {
    id: string;
    name: string;
    description?: string;
}

export default function FormationDetailPage() {
    const firestore = useFirestore();
    const params = useParams();
    const formationId = params.formationId as string;

    const formationRef = useMemoFirebase(() => {
        if (!firestore || !formationId) return null;
        return doc(firestore, 'course_formations', formationId);
    }, [firestore, formationId]);

    const { data: formation, isLoading: isFormationLoading } = useDoc<Formation>(formationRef);
    
    // Fetch the theme based on themeId from the formation
    const themeRef = useMemoFirebase(() => {
        if (!firestore || !formation?.themeId) return null;
        return doc(firestore, 'course_themes', formation.themeId);
    }, [firestore, formation]);

    const { data: theme, isLoading: isThemeLoading } = useDoc<Theme>(themeRef);

    const modulesQuery = useMemoFirebase(() => {
        if (!firestore || !formationId) return null;
        return query(collection(firestore, 'course_modules'), where('formationId', '==', formationId), orderBy('name', 'asc'));
    }, [firestore, formationId]);

    const { data: modules, isLoading: areModulesLoading } = useCollection<Module>(modulesQuery);
    
    const isLoading = isFormationLoading || isThemeLoading;

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-12 md:px-6">
                <header className="mb-12">
                    <Skeleton className="h-6 w-1/3 mb-4" />
                    <Skeleton className="h-10 w-3/4" />
                    <Skeleton className="h-6 w-1/2 mt-4" />
                </header>
                <div className="grid lg:grid-cols-3 gap-12">
                    <div className="lg:col-span-2 space-y-10">
                        <Skeleton className="h-32 w-full" />
                        <Skeleton className="h-32 w-full" />
                        <Skeleton className="h-48 w-full" />
                    </div>
                    <aside className="space-y-6">
                        <Skeleton className="h-64 w-full" />
                    </aside>
                </div>
            </div>
        );
    }

    if (!formation) {
        return <div className="container py-12 text-center text-muted-foreground">Formation not found.</div>;
    }

    const DetailCard = ({ icon, title, content }: { icon: React.ReactNode, title: string, content?: string }) => {
        if (!content) return null;
        return (
            <div className="flex items-start gap-4">
                <div className="text-primary">{icon}</div>
                <div>
                    <h3 className="font-semibold">{title}</h3>
                    <p className="text-sm text-muted-foreground">{content}</p>
                </div>
            </div>
        )
    };

    return (
        <div className="bg-background">
            <header className="py-12 bg-muted/30 border-b">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="max-w-4xl">
                        <div className="flex items-center text-sm text-muted-foreground mb-4">
                            {theme ? (
                                <Link href={`/courses?themeId=${theme.id}`} className="hover:text-primary">
                                    {theme.name}
                                </Link>
                            ) : <Skeleton className="h-5 w-24" />}
                            <ChevronRight size={16} className="mx-1" />
                            <span className="font-medium text-foreground">{formation.formationId}</span>
                        </div>
                        <h1 className="text-3xl font-normal tracking-tighter sm:text-4xl font-headline text-primary">
                            {formation.name}
                        </h1>
                        {formation.objectifPedagogique &&
                            <p className="mt-4 text-lg text-muted-foreground">{formation.objectifPedagogique}</p>
                        }
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-12 md:px-6">
                <div className="grid lg:grid-cols-3 gap-12">
                    <div className="lg:col-span-2 space-y-10">
                        <section>
                            <h2 className="text-2xl font-headline font-normal text-primary mb-6 flex items-center gap-3"><BookOpen size={24}/>Détails de la Formation</h2>
                            <div className="space-y-6">
                                <DetailCard icon={<Target size={20} />} title="Public Concerné" content={formation.publicConcerne} />
                                <DetailCard icon={<CheckCircle size={20} />} title="Pré-requis" content={formation.preRequis} />
                                <DetailCard icon={<Award size={20} />} title="Méthodes Mobilisées" content={formation.methodesMobilisees} />
                                <DetailCard icon={<Users size={20} />} title="Moyens Pédagogiques" content={formation.moyensPedagogiques} />
                                <DetailCard icon={<BookOpen size={20} />} title="Modalités d'Évaluation" content={formation.modalitesEvaluation} />
                            </div>
                        </section>
                        
                        {(formation.prixSansHebergement || formation.prixAvecHebergement) && (
                             <section>
                                <h2 className="text-2xl font-headline font-normal text-primary mb-6 flex items-center gap-3"><Banknote size={24}/>Tarifs</h2>
                                <div className="space-y-4 max-w-lg border rounded-lg p-6 bg-muted/20">
                                    {formation.prixSansHebergement && (
                                        <div className="flex items-baseline justify-between text-sm">
                                            <div className="flex items-center gap-2 text-muted-foreground"><Banknote size={16}/>Formation seule</div>
                                            <div className="text-right">
                                                <p className="text-xs text-muted-foreground">à partir de</p>
                                                <p className="font-semibold text-lg">{formation.prixSansHebergement} €</p>
                                            </div>
                                        </div>
                                    )}
                                    {formation.prixAvecHebergement && (
                                        <div className="flex items-baseline justify-between text-sm">
                                            <div className="flex items-center gap-2 text-muted-foreground"><Building size={16}/>Forfait avec hébergement</div>
                                            <div className="text-right">
                                                <p className="text-xs text-muted-foreground">à partir de</p>
                                                <p className="font-semibold text-lg">{formation.prixAvecHebergement} €</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </section>
                        )}
                        
                        {areModulesLoading ? <Skeleton className="h-48 w-full" /> : modules && modules.length > 0 && (
                            <section>
                                <h2 className="text-2xl font-headline font-normal text-primary mb-6 flex items-center gap-3"><ListTree size={24}/>Programme de la Formation</h2>
                                <Accordion type="single" collapsible className="w-full">
                                    {modules.sort((a,b) => a.name.localeCompare(b.name, undefined, {numeric: true})).map(module => (
                                        <AccordionItem key={module.id} value={module.id}>
                                            <AccordionTrigger>{module.name}</AccordionTrigger>
                                            <AccordionContent>
                                                {module.description || "Aucune description détaillée disponible pour ce module."}
                                            </AccordionContent>
                                        </AccordionItem>
                                    ))}
                                </Accordion>
                            </section>
                        )}
                    </div>
                    
                    <aside className="sticky top-24 self-start">
                         <div className="bg-muted/30 p-6 rounded-lg border">
                           <CourseInquiryForm courseName={formation.name} />
                         </div>
                    </aside>
                </div>
            </main>
        </div>
    );
}
