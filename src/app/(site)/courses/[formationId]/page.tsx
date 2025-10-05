
'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where, orderBy } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Users, Target, CheckCircle, Award, ListTree, Banknote, Building, ChevronRight, Info, Calendar, Clock, Laptop, MapPin } from 'lucide-react';
import { CourseInquiryForm } from '@/components/course-inquiry-form';
import Image from 'next/image';
import { addMonths, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';


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

interface Campus {
    id: string;
    name: string;
    imageUrl?: string;
    slug: string;
}

interface MonthAvailability {
  month: string;
  year: string;
  isAvailable: boolean;
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

const MediaPreview = ({ url, alt, className }: { url: string; alt: string; className?: string }) => {
    if (isVideoUrl(url)) {
        return (
            <video src={url} autoPlay loop muted playsInline className={cn("h-full w-full object-cover", className)}/>
        );
    }
    return (
        <Image src={url} alt={alt} fill className={cn("object-cover", className)} />
    );
}

export default function FormationDetailPage() {
    const firestore = useFirestore();
    const params = useParams();
    const formationId = params.formationId as string;
    const [availability, setAvailability] = useState<MonthAvailability[]>([]);
    const [numberOfPeople, setNumberOfPeople] = useState(3);

    useEffect(() => {
        const today = new Date();
        const months: MonthAvailability[] = [];
        for (let i = 0; i < 7; i++) {
            const date = addMonths(today, i);
            months.push({
                month: format(date, 'MMMM', { locale: fr }),
                year: format(date, 'yyyy', { locale: fr }),
                isAvailable: i !== 4 && i !== 6,
            });
        }
        setAvailability(months);
    }, []);


    const formationRef = useMemoFirebase(() => {
        if (!firestore || !formationId) return null;
        return doc(firestore, 'course_formations', formationId);
    }, [firestore, formationId]);

    const { data: formation, isLoading: isFormationLoading } = useDoc<Formation>(formationRef);
    
    const themeRef = useMemoFirebase(() => {
        if (!firestore || !formation?.themeId) return null;
        return doc(firestore, 'course_themes', formation.themeId);
    }, [firestore, formation]);

    const { data: theme, isLoading: isThemeLoading } = useDoc<Theme>(themeRef);

    const modulesQuery = useMemoFirebase(() => {
        if (!firestore || !formationId) return null;
        return query(collection(firestore, 'course_modules'), where('formationId', '==', formationId));
    }, [firestore, formationId]);
    
    const campusesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'campuses'), orderBy('name', 'asc'));
    }, [firestore]);

    const { data: modules, isLoading: areModulesLoading } = useCollection<Module>(modulesQuery);
    const { data: campuses, isLoading: areCampusesLoading } = useCollection<Campus>(campusesQuery);
    
    const isLoading = isFormationLoading || isThemeLoading || areCampusesLoading;

    const sortedModules = useMemo(() => {
        if (!modules) return [];
        return [...modules].sort((a, b) => {
            const numA = parseInt(a.name.match(/\d+/)?.[0] || '0');
            const numB = parseInt(b.name.match(/\d+/)?.[0] || '0');
            return numA - numB;
        });
    }, [modules]);
    
    const calculatePrice = (basePriceString: string | undefined) => {
        if (!basePriceString) return 'N/A';
        const basePrice = parseFloat(basePriceString);
        if (isNaN(basePrice)) return 'N/A';

        let finalPrice = basePrice;
        if (numberOfPeople === 1) {
            finalPrice = basePrice * 1.4;
        } else if (numberOfPeople === 2) {
            finalPrice = basePrice * 1.2;
        }

        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(finalPrice);
    };

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
                        
                        {areModulesLoading ? <Skeleton className="h-48 w-full" /> : sortedModules && sortedModules.length > 0 && (
                             <section>
                                <h2 className="text-2xl font-headline font-normal text-primary mb-6 flex items-center gap-3"><ListTree size={24}/>Programme de la Formation</h2>
                                <div className="space-y-4 border-l-2 border-primary/20 pl-6">
                                    {sortedModules.map((module, index) => (
                                        <div key={module.id} className="relative">
                                            <div className="absolute -left-[30px] top-1.5 h-3 w-3 rounded-full bg-primary" />
                                            <p className="font-semibold text-foreground">{`Module ${index + 1}`}</p>
                                            <p className="text-muted-foreground text-sm">
                                                {module.name}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        <section id="availability">
                            <h2 className="text-2xl font-headline font-normal text-primary mb-6 flex items-center gap-3"><Calendar size={24}/>Disponibilité</h2>
                             <div className="flex flex-wrap gap-4">
                                {availability.length > 0 ? (
                                    availability.map((month) => (
                                        <div key={month.month + month.year} className={cn("flex flex-col items-center justify-center p-4 rounded-lg border text-sm w-32 h-32", month.isAvailable ? "bg-green-50/50 border-green-200" : "bg-red-50/50 border-red-200 text-muted-foreground")}>
                                            <div className="text-center">
                                                <p className="font-semibold capitalize">{month.month}</p>
                                                <p className="text-xs">{month.year}</p>
                                            </div>
                                            {month.isAvailable ? (
                                                <Badge variant="secondary" className="mt-2 bg-green-100 text-green-800">Disponible</Badge>
                                            ) : (
                                                <Badge variant="secondary" className="mt-2 bg-red-100 text-red-800">Complet</Badge>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-32 w-32" />)
                                )}
                            </div>
                        </section>

                         <section id="informations">
                            <h2 className="text-2xl font-headline font-normal text-primary mb-6 flex items-center gap-3"><Info size={24}/>Informations</h2>
                             <div className="space-y-8">
                                <div>
                                    <h3 className="font-semibold flex items-center gap-2 mb-3"><MapPin size={20} /> Lieux</h3>
                                    <div className="flex flex-wrap gap-4">
                                        {campuses && campuses.map(campus => (
                                            <Link href={`/campus/${campus.slug}`} key={campus.id} className="w-48 text-center group">
                                                <div className="relative w-48 h-32 rounded-lg overflow-hidden border">
                                                    {campus.imageUrl ? (
                                                        <MediaPreview url={campus.imageUrl} alt={campus.name} className="transition-transform duration-300 group-hover:scale-105" />
                                                    ) : (
                                                        <div className="w-full h-full bg-muted flex items-center justify-center text-xs text-muted-foreground">No Media</div>
                                                    )}
                                                </div>
                                                <p className="text-sm font-medium mt-2 group-hover:text-primary">{campus.name}</p>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                                    <div>
                                        <h3 className="font-semibold flex items-center gap-2 mb-2"><Calendar size={20} /> Durée</h3>
                                        <p className="text-sm text-muted-foreground">Deux semaines</p>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold flex items-center gap-2 mb-2"><Clock size={20} /> Heures de cours</h3>
                                        <p className="text-sm text-muted-foreground">55 heures</p>
                                    </div>
                                     {formation.format && (
                                        <div>
                                            <h3 className="font-semibold flex items-center gap-2 mb-2"><Laptop size={20} /> Format</h3>
                                            <Badge variant="outline">{formation.format}</Badge>
                                        </div>
                                     )}
                                </div>
                             </div>
                        </section>
                        
                        {(formation.prixSansHebergement || formation.prixAvecHebergement) && (
                            <section>
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                                    <h2 className="text-2xl font-headline font-normal text-primary flex items-center gap-3"><Banknote size={24}/>Tarifs</h2>
                                    <div className="flex items-center gap-2 mt-4 sm:mt-0">
                                        <Label>Personnes:</Label>
                                        <Select value={String(numberOfPeople)} onValueChange={(val) => setNumberOfPeople(Number(val))}>
                                            <SelectTrigger className="w-[80px]">
                                                <SelectValue placeholder="3" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Array.from({ length: 20 }, (_, i) => i + 1).map(num => (
                                                    <SelectItem key={num} value={String(num)}>{num}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="grid sm:grid-cols-2 gap-6">
                                    {formation.prixSansHebergement && (
                                        <Card className="border-primary/50">
                                            <CardContent className="pt-6">
                                                <div className="flex flex-col items-center text-center">
                                                    <div className="flex items-center gap-2 text-muted-foreground"><Banknote size={18}/></div>
                                                    <h4 className="font-semibold mt-2">Formation seule</h4>
                                                    <p className="text-xs text-muted-foreground mt-1">Par personne</p>
                                                    <p className="font-semibold text-2xl mt-4">{calculatePrice(formation.prixSansHebergement)}</p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}
                                    {formation.prixAvecHebergement && (
                                        <Card className="border-primary/50 bg-primary/5">
                                            <CardContent className="pt-6">
                                                <div className="flex flex-col items-center text-center">
                                                    <div className="flex items-center gap-2 text-muted-foreground"><Building size={18}/></div>
                                                    <h4 className="font-semibold mt-2">Forfait avec hébergement</h4>
                                                    <p className="text-xs text-muted-foreground mt-1">Par personne</p>
                                                    <p className="font-semibold text-2xl mt-4">{calculatePrice(formation.prixAvecHebergement)}</p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}
                                </div>
                            </section>
                        )}
                        
                    </div>
                    
                    <aside className="sticky top-24 self-start">
                         <div className="bg-white p-6 rounded-lg border">
                           <CourseInquiryForm courseName={formation.name} />
                         </div>
                    </aside>
                </div>
            </main>
        </div>
    );
}
