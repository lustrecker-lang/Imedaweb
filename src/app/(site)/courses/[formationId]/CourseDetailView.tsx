
'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, Phone, Mail, GraduationCap, Building, Check, ArrowLeft } from 'lucide-react';
import { CourseInquiryForm } from '@/components/course-inquiry-form';
import Image from 'next/image';
import { addMonths, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';


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

interface Service {
    id: string;
    name: string;
    isOptional: boolean;
    mediaUrl?: string;
}

interface CourseDetailPageContent {
  valeurImeda: { title: string; content: string; imageUrl: string };
  faq: { id: string; question: string; answer: string }[];
  contact: { name: string; title: string; description: string; francePhone: string; uaePhone: string; email: string; imageUrl: string };
}

interface CourseDetailViewProps {
    formation: Formation | null;
    theme: Theme | null;
    modules: Module[];
    campuses: Campus[];
    allServices: Service[];
    coursePageContent: CourseDetailPageContent | null;
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
            <video src={url} autoPlay loop muted playsInline className={cn("absolute inset-0 h-full w-full object-cover", className)}/>
        );
    }
    return (
        <Image src={url} alt={alt} fill className={cn("object-cover", className)} />
    );
}

export default function CourseDetailView({ formation, theme, modules, campuses, allServices, coursePageContent }: CourseDetailViewProps) {
    const searchParams = useSearchParams();
    const [availability, setAvailability] = useState<MonthAvailability[]>([]);
    const [numberOfPeople, setNumberOfPeople] = useState(3);
    const isMobile = useIsMobile();
    const [isEnquirySheetOpen, setIsEnquirySheetOpen] = useState(false);
    
    const cameFromCatalog = useMemo(() => searchParams.get('from') === 'catalog', [searchParams]);

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

    if (!formation) {
        return <div className="container py-12 text-center text-muted-foreground">Formation not found.</div>;
    }

    const DetailCard = ({ title, content }: { title: string, content?: string }) => {
        if (!content) return null;
        return (
            <div>
                <h3 className="font-normal">{title}</h3>
                <p className="text-sm text-muted-foreground">{content}</p>
            </div>
        )
    };

    return (
        <div className="bg-background">
             {isMobile && (
                <div className="sticky top-16 z-40 bg-background/95 backdrop-blur-sm border-b md:hidden">
                    <div className="container px-4 h-12 flex items-center">
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/courses">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Catalogue
                            </Link>
                        </Button>
                    </div>
                </div>
            )}
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
                    <div className="lg:col-span-2">
                         <Accordion type="multiple" defaultValue={['item-1', 'item-details', 'item-contact']} className="w-full">
                            <AccordionItem value="item-1">
                                <AccordionTrigger>
                                    <h2 className="text-2xl font-headline font-normal text-primary">Informations</h2>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="space-y-8 pt-4">
                                        <div>
                                            <h3 className="font-normal mb-3">Cette formation est disponible dans tous ces campus.</h3>
                                             <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                                {campuses && campuses.map(campus => (
                                                    <div key={campus.id} className="group relative overflow-hidden rounded-lg aspect-w-4 aspect-h-3">
                                                        <Link href={`/campus/${campus.slug}`} className="absolute inset-0 z-10">
                                                            <span className="sr-only">View {campus.name}</span>
                                                        </Link>
                                                        <div className="relative w-full h-full min-h-[120px]">
                                                            {campus.imageUrl ? (
                                                                <MediaPreview url={campus.imageUrl} alt={campus.name} className="transition-transform duration-300 group-hover:scale-105" />
                                                            ) : (
                                                                <div className="w-full h-full bg-muted flex items-center justify-center text-xs text-muted-foreground">No Media</div>
                                                            )}
                                                             <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                                                            <p className="absolute bottom-2 left-3 text-sm font-semibold text-white">{campus.name}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-y-4">
                                            <div className="sm:pl-0">
                                                <h3 className="font-normal">Durée</h3>
                                                <p className="text-sm text-muted-foreground">14 jours</p>
                                            </div>
                                             <div className="border-l pl-4">
                                                <h3 className="font-normal">Heures de cours</h3>
                                                <p className="text-sm text-muted-foreground">55 heures</p>
                                            </div>
                                             {formation.format && (
                                                <div className="border-l pl-4">
                                                    <h3 className="font-normal">Format</h3>
                                                    <p className="text-sm text-muted-foreground">{formation.format}</p>
                                                </div>
                                             )}
                                             <div className="border-l pl-4">
                                                <h3 className="font-normal">Langue</h3>
                                                <p className="text-sm text-muted-foreground">Français</p>
                                            </div>
                                            <div className="border-l pl-4">
                                                <h3 className="font-normal">Course ID</h3>
                                                <p className="text-sm text-muted-foreground">{formation.formationId}</p>
                                            </div>
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                             <AccordionItem value="item-2">
                                <AccordionTrigger>
                                    <h2 className="text-2xl font-headline font-normal text-primary">Tarifs</h2>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="pt-4">
                                        <div className="flex items-center gap-2 mb-6">
                                            <Label htmlFor="people-select">Personnes:</Label>
                                            <Select value={String(numberOfPeople)} onValueChange={(val) => setNumberOfPeople(Number(val))}>
                                                <SelectTrigger id="people-select" className="w-full sm:w-[80px]">
                                                    <SelectValue placeholder="3" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {Array.from({ length: 20 }, (_, i) => i + 1).map(num => (
                                                        <SelectItem key={num} value={String(num)}>{num}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            {formation.prixSansHebergement && (
                                                <Card className="border-primary/50">
                                                    <CardContent className="pt-6 min-h-[180px] flex flex-col items-center justify-between">
                                                        <div className="text-center">
                                                            <div className="flex items-center justify-center gap-2 text-muted-foreground"><GraduationCap size={18}/></div>
                                                            <h4 className="font-semibold mt-2 text-xs sm:text-base">Formation seule</h4>
                                                        </div>
                                                        <div className="text-center">
                                                            <p className="text-xs text-muted-foreground">à partir de</p>
                                                            <p className="font-semibold text-lg sm:text-2xl mt-1">{calculatePrice(formation.prixSansHebergement)}</p>
                                                            <p className="text-xs text-muted-foreground mt-2">Par personne</p>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            )}
                                            {formation.prixAvecHebergement && (
                                                <Card className="border-primary/50 bg-primary/5">
                                                    <CardContent className="pt-6 min-h-[180px] flex flex-col items-center justify-between">
                                                        <div className="text-center">
                                                             <div className="flex items-center justify-center gap-2 text-muted-foreground"><Building size={18}/></div>
                                                            <h4 className="font-semibold mt-2 text-sm sm:text-base">Forfait avec hébergement</h4>
                                                        </div>
                                                        <div className="text-center">
                                                            <p className="text-xs text-muted-foreground">à partir de</p>
                                                            <p className="font-semibold text-lg sm:text-2xl mt-1">{calculatePrice(formation.prixAvecHebergement)}</p>
                                                            <p className="text-xs text-muted-foreground mt-2">Par personne</p>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            )}
                                        </div>
                                        <div className="text-left mt-6">
                                            <p className="text-xs text-muted-foreground">
                                                Les prix sont approximatifs et peuvent varier en fonction du mois, du nombre de personnes, de la disponibilité et de nombreux autres facteurs.
                                            </p>
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                            {sortedModules && sortedModules.length > 0 && (
                                <AccordionItem value="item-4">
                                <AccordionTrigger>
                                    <h2 className="text-2xl font-headline font-normal text-primary">Programme de la formation</h2>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="pt-4">
                                        <Table>
                                            <TableBody>
                                                {sortedModules.map((module, index) => (
                                                    <TableRow 
                                                        key={module.id} 
                                                        className={cn(
                                                            "flex flex-col md:table-row hover:bg-transparent",
                                                            index === sortedModules.length - 1 ? "border-b-0" : "border-b-[0.5px] md:border-b"
                                                        )}
                                                    >
                                                        <TableCell className="w-full md:w-[150px] shrink-0 font-medium py-3 md:py-4 border-b-[0.5px] border-b-border/50 md:border-b-0 md:border-r">
                                                            <div className="flex items-start gap-4">
                                                                <div className="w-[100px] shrink-0">
                                                                    <div className="font-semibold text-xs">Module {index + 1}</div>
                                                                    <div className="text-xs text-muted-foreground">{index % 2 === 0 ? '1 Jour' : '2 Jours'}</div>
                                                                </div>
                                                                <div className="md:hidden flex-1 text-sm">{module.name}</div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="hidden md:table-cell py-3 md:py-4 text-sm">{module.name}</TableCell>
                                                        <TableCell className="hidden md:table-cell text-right py-3 md:py-4 text-sm text-muted-foreground">{index % 2 === 0 ? '1 Jour' : '2 Jours'}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                            )}
                             <AccordionItem value="item-6">
                                <AccordionTrigger>
                                    <h2 className="text-2xl font-headline font-normal text-primary">Services</h2>
                                </AccordionTrigger>
                                <AccordionContent>
                                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 pt-4">
                                        {allServices.map((service, index) => (
                                            <div key={service.id} className={cn(
                                                "flex items-center justify-between gap-4 py-3",
                                                (index < allServices.length - (allServices.length % 2 === 0 ? 2 : 1)) && "sm:border-b"
                                            )}>
                                                <div className="flex items-center gap-4">
                                                     {service.mediaUrl ? (
                                                        <div className="relative h-10 w-10 shrink-0 rounded-sm overflow-hidden">
                                                            <MediaPreview url={service.mediaUrl} alt={service.name} />
                                                        </div>
                                                    ) : (
                                                        <div className="h-10 w-10 shrink-0 rounded-sm bg-muted-foreground/20" />
                                                    )}
                                                    <span className="text-sm font-medium">{service.name}</span>
                                                </div>
                                                 <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    {!service.isOptional ? (
                                                        <>
                                                            <Check size={16} className="text-green-600" />
                                                            <span>Inclus</span>
                                                        </>
                                                    ) : (
                                                        <span>Optionnel</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                             <AccordionItem value="item-5">
                                <AccordionTrigger>
                                    <h2 className="text-2xl font-headline font-normal text-primary">Disponibilité</h2>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="grid grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4 pt-4">
                                        {availability.length > 0 ? (
                                            availability.map((month) => (
                                                <div key={month.month + month.year} className={cn("flex flex-col items-center justify-center p-2 sm:p-4 rounded-lg border text-center text-sm aspect-square", month.isAvailable ? "bg-green-50/50 border-green-200" : "bg-red-50/50 border-red-200 text-muted-foreground")}>
                                                    <div className="">
                                                        <p className="font-semibold capitalize text-xs sm:text-sm">{month.month}</p>
                                                        <p className="text-xs">{month.year}</p>
                                                    </div>
                                                    {month.isAvailable ? (
                                                        <Badge variant="secondary" className="mt-2 text-xs bg-green-100 text-green-800">Disponible</Badge>
                                                    ) : (
                                                        <Badge variant="secondary" className="mt-2 text-xs bg-red-100 text-red-800">Complet</Badge>
                                                    )}
                                                </div>
                                            ))
                                        ) : (
                                            Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="aspect-square w-full" />)
                                        )}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="item-details">
                                <AccordionTrigger>
                                    <h2 className="text-2xl font-headline font-normal text-primary">Détails de la formation</h2>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="space-y-6 pt-4 whitespace-pre-wrap">
                                        <DetailCard title="Public Concerné" content={formation.publicConcerne} />
                                        <DetailCard title="Pré-requis" content={formation.preRequis} />
                                        <DetailCard title="Méthodes Mobilisées" content={formation.methodesMobilisees} />
                                        <DetailCard title="Moyens Pédagogiques" content={formation.moyensPedagogiques} />
                                        <DetailCard title="Modalités d'Évaluation" content={formation.modalitesEvaluation} />
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                            {coursePageContent?.valeurImeda && (
                            <AccordionItem value="item-valeur">
                                <AccordionTrigger>
                                    <h2 className="text-2xl font-headline font-normal text-primary">
                                        {coursePageContent.valeurImeda.title}
                                    </h2>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="grid md:grid-cols-2 gap-8 items-center pt-4">
                                        <div className="relative aspect-video md:aspect-auto h-full min-h-[250px] w-full overflow-hidden">
                                            <Image 
                                                src={coursePageContent.valeurImeda.imageUrl}
                                                alt={coursePageContent.valeurImeda.title}
                                                fill
                                                className="object-cover"
                                                data-ai-hint="network growth"
                                            />
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground mt-2">
                                               {coursePageContent.valeurImeda.content}
                                            </p>
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                            )}
                            {coursePageContent?.faq && coursePageContent.faq.length > 0 && (
                             <AccordionItem value="faq">
                                <AccordionTrigger>
                                    <h2 className="text-2xl font-headline font-normal text-primary">FAQ</h2>
                                </AccordionTrigger>
                                <AccordionContent className="whitespace-pre-wrap">
                                    <Accordion type="single" collapsible className="w-full">
                                        {coursePageContent.faq.map(item => (
                                            <AccordionItem value={item.id} key={item.id}>
                                                <AccordionTrigger>{item.question}</AccordionTrigger>
                                                <AccordionContent className="text-sm text-muted-foreground whitespace-pre-wrap">
                                                    {item.answer}
                                                </AccordionContent>
                                            </AccordionItem>
                                        ))}
                                    </Accordion>
                                </AccordionContent>
                            </AccordionItem>
                            )}
                            {coursePageContent?.contact && (
                            <AccordionItem value="item-contact">
                                <AccordionTrigger>
                                    <h2 className="text-2xl font-headline font-normal text-primary">Contactez-nous</h2>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="grid md:grid-cols-2 gap-8 items-center pt-4">
                                        <div className="relative aspect-square md:aspect-auto h-full w-full mx-auto md:mx-0 max-w-[200px] md:max-w-none overflow-hidden self-stretch">
                                            <Image 
                                                src={coursePageContent.contact.imageUrl}
                                                alt={coursePageContent.contact.name}
                                                fill
                                                className="object-cover"
                                                data-ai-hint="professional woman portrait"
                                            />
                                        </div>
                                        <div className="text-center md:text-left">
                                            <h3 className="text-2xl font-headline font-normal text-foreground">{coursePageContent.contact.name}</h3>
                                            <p className="text-sm text-primary/80">{coursePageContent.contact.title}</p>
                                            <p className="text-sm text-muted-foreground mt-4 max-w-md mx-auto md:mx-0">
                                               {coursePageContent.contact.description}
                                            </p>
                                            <div className="flex flex-col items-center md:items-start gap-4 mt-4">
                                                <a href={`tel:${coursePageContent.contact.francePhone}`} className="flex items-center gap-2 text-sm text-primary hover:underline">
                                                    <Phone size={16} />
                                                    <span>France: {coursePageContent.contact.francePhone}</span>
                                                </a>
                                                <a href={`tel:${coursePageContent.contact.uaePhone}`} className="flex items-center gap-2 text-sm text-primary hover:underline">
                                                    <Phone size={16} />
                                                    <span>EAU: {coursePageContent.contact.uaePhone}</span>
                                                </a>
                                                 <a href={`mailto:${coursePageContent.contact.email}`} className="flex items-center gap-2 text-sm text-primary hover:underline">
                                                    <Mail size={16} />
                                                    <span>{coursePageContent.contact.email}</span>
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                            )}
                         </Accordion>
                    </div>
                    
                    <aside className="sticky top-24 self-start hidden lg:block">
                         <div className="bg-white p-6 rounded-lg border">
                           <CourseInquiryForm courseName={formation.name} showHeader={false} />
                         </div>
                    </aside>
                </div>
            </main>
             {isMobile && (
                <div className="sticky bottom-0 z-40 bg-background/95 p-4 border-t lg:hidden">
                    <Sheet open={isEnquirySheetOpen} onOpenChange={setIsEnquirySheetOpen}>
                        <SheetTrigger asChild>
                            <Button className="w-full">En Savoir plus</Button>
                        </SheetTrigger>
                        <SheetContent side="bottom" className="h-[90vh] flex flex-col">
                           <div className="overflow-y-auto p-2">
                             <CourseInquiryForm courseName={formation.name} showHeader={true} />
                           </div>
                        </SheetContent>
                    </Sheet>
                </div>
            )}
        </div>
    );
}
