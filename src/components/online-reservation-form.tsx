'use client';

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CheckCircle, Loader2, Minus, Plus, ArrowLeft } from "lucide-react";
import { useFirestore } from "@/firebase";
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { addMonths, format } from 'date-fns';
import { fr } from 'date-fns/locale';

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const FRANCOPHONE_COUNTRIES = [
    "Bénin",
    "Burkina Faso",
    "Burundi",
    "Cameroun",
    "Centrafrique",
    "Comores",
    "Congo-Brazzaville",
    "Congo-Kinshasa",
    "Côte d'Ivoire",
    "Djibouti",
    "Gabon",
    "Guinée",
    "Guinée Équatoriale",
    "Madagascar",
    "Mali",
    "Maroc",
    "Maurice",
    "Mauritanie",
    "Niger",
    "Rwanda",
    "Sénégal",
    "Seychelles",
    "Tchad",
    "Togo",
    "Tunisie",
    "Autre"
];

// Step 1: Contact info (shared with inquiry)
const step1Schema = z.object({
    fullName: z.string().min(1, { message: "Le nom complet est requis." }),
    email: z.string().email({ message: "Veuillez saisir une adresse e-mail valide." }),
    phone: z.string().optional(),
    message: z.string().optional(),
});

// Step 2: Reservation details
const step2Schema = z.object({
    startDate: z.string().min(1, { message: "Veuillez sélectionner une date de début." }),
    numberOfPeople: z.number().min(1).max(20),
    country: z.string().min(1, { message: "Veuillez sélectionner votre pays." }),
});

interface OnlineCourseFormProps {
    courseName: string;
    pricePerMonth?: string;
    durationMonths?: string;
    isOnline?: boolean;
    showHeader?: boolean;
}

// Helper for generating start dates
const getNextStartDates = (count = 6) => {
    const dates: Date[] = [];
    const today = new Date();
    let current = addMonths(today, 1);
    current.setDate(1);

    for (let i = 0; i < count; i++) {
        dates.push(new Date(current));
        current = addMonths(current, 1);
    }
    return dates;
}

type FormStep = 'contact' | 'reservation' | 'success';
type SubmitType = 'inquiry' | 'reservation';

export function OnlineCourseForm({
    courseName,
    pricePerMonth = '0',
    durationMonths = '1',
    isOnline = false,
    showHeader = false
}: OnlineCourseFormProps) {
    const [step, setStep] = useState<FormStep>('contact');
    const [submitType, setSubmitType] = useState<SubmitType>('inquiry');
    const firestore = useFirestore();

    const startDates = useMemo(() => getNextStartDates(), []);
    const monthlyPrice = parseFloat(pricePerMonth) || 0;
    const duration = parseInt(durationMonths) || 1;

    // Step 1 form (contact info)
    const step1Form = useForm<z.infer<typeof step1Schema>>({
        resolver: zodResolver(step1Schema),
        defaultValues: {
            fullName: "",
            email: "",
            phone: "",
            message: "",
        },
    });

    // Step 2 form (reservation details)
    const step2Form = useForm<z.infer<typeof step2Schema>>({
        resolver: zodResolver(step2Schema),
        defaultValues: {
            startDate: "",
            numberOfPeople: 1,
            country: "",
        },
    });

    const numberOfPeople = step2Form.watch("numberOfPeople");
    const selectedStartDate = step2Form.watch("startDate");

    const priceBreakdown = useMemo(() => {
        const totalPerPerson = monthlyPrice * duration;
        const grandTotal = totalPerPerson * numberOfPeople;
        return { totalPerPerson, grandTotal };
    }, [monthlyPrice, duration, numberOfPeople]);

    const selectedEndDate = useMemo(() => {
        if (!selectedStartDate) return null;
        const start = new Date(selectedStartDate);
        return addMonths(start, duration);
    }, [selectedStartDate, duration]);

    // Handle Step 1 - "Se renseigner" (just inquiry)
    async function handleInquiry() {
        const isValid = await step1Form.trigger();
        if (!isValid || !firestore) return;

        const values = step1Form.getValues();

        try {
            const leadsCollection = collection(firestore, 'leads');
            await addDoc(leadsCollection, {
                ...values,
                leadType: "Course Inquiry",
                courseName: courseName,
                createdAt: serverTimestamp(),
            });

            // Fire Google Ads conversion event
            if (typeof window !== 'undefined' && (window as any).gtag) {
                // Signal 1: Google Ads (High Value Conversion)
                (window as any).gtag('event', 'conversion', {
                    'send_to': 'AW-17882391668/6z7uCNbPjucbEPTI_s5C',
                });

                // Signal 2: Google Analytics (High Value Report)
                (window as any).gtag('event', 'generate_lead', {
                    'method': 'Course Sidebar Form',
                    'value': 100,
                    'currency': 'AED'
                });
            }

            setSubmitType('inquiry');
            setStep('success');
        } catch (error) {
            console.error("Error submitting inquiry:", error);
        }
    }

    // Handle Step 1 - "Réserver ma place" (go to step 2)
    async function handleGoToReservation() {
        const isValid = await step1Form.trigger();
        if (isValid) {
            setStep('reservation');
        }
    }

    // Handle Step 2 - Submit reservation
    async function handleReservation() {
        const isValid = await step2Form.trigger();
        if (!isValid || !firestore) return;

        const contactValues = step1Form.getValues();
        const reservationValues = step2Form.getValues();

        try {
            const leadsCollection = collection(firestore, 'leads');
            await addDoc(leadsCollection, {
                fullName: contactValues.fullName,
                email: contactValues.email,
                phone: contactValues.phone,
                message: contactValues.message,
                startDate: reservationValues.startDate,
                numberOfPeople: reservationValues.numberOfPeople,
                country: reservationValues.country,
                leadType: "Online Course Reservation",
                courseName: courseName,
                pricePerMonth: monthlyPrice,
                durationMonths: duration,
                totalPrice: priceBreakdown.grandTotal,
                createdAt: serverTimestamp(),
            });

            // Fire Google Ads conversion event
            if (typeof window !== 'undefined' && (window as any).gtag) {
                // Signal 1: Google Ads (High Value Conversion)
                (window as any).gtag('event', 'conversion', {
                    'send_to': 'AW-17882391668/6z7uCNbPjucbEPTI_s5C',
                });

                // Signal 2: Google Analytics (High Value Report)
                (window as any).gtag('event', 'generate_lead', {
                    'method': 'Online Course Reservation Form',
                    'value': 100,
                    'currency': 'AED'
                });
            }

            setSubmitType('reservation');
            setStep('success');
        } catch (error) {
            console.error("Error submitting reservation:", error);
        }
    }

    // Success state
    if (step === 'success') {
        return (
            <div className="flex flex-col items-center justify-center text-center space-y-4 py-8">
                <CheckCircle className="h-16 w-16 text-green-500" />
                <h3 className="text-xl font-headline font-normal">
                    {submitType === 'reservation' ? 'Réservation enregistrée!' : 'Demande envoyée!'}
                </h3>
                <p className="text-xs text-muted-foreground max-w-xs">
                    Merci! Un de nos conseillers vous contactera sous peu
                    {submitType === 'reservation' && ' pour finaliser votre inscription'}.
                </p>
            </div>
        );
    }

    // Step 2: Reservation details
    if (step === 'reservation') {
        return (
            <div key="reservation">
                {showHeader && (
                    <SheetHeader className="mb-4 text-left">
                        <SheetTitle className="font-headline text-2xl font-normal">Réserver ma place</SheetTitle>
                        <SheetDescription>
                            Formation : <span className="font-semibold">{courseName}</span>
                        </SheetDescription>
                    </SheetHeader>
                )}
                <div className={cn(!showHeader && "pt-0")}>
                    {!showHeader && (
                        <div className="mb-4">
                            <button
                                onClick={() => setStep('contact')}
                                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2"
                            >
                                <ArrowLeft size={14} />
                                Retour
                            </button>
                            <h3 className="font-headline text-2xl font-normal">Réserver ma place</h3>
                        </div>
                    )}
                    <Form {...step2Form}>
                        <form onSubmit={(e) => { e.preventDefault(); handleReservation(); }} className="space-y-4">
                            {/* Start Date Selection */}
                            <FormField
                                control={step2Form.control}
                                name="startDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Période du cours</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Sélectionnez une période" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {startDates.map((date) => {
                                                    const endDate = addMonths(date, duration);
                                                    const dateStr = `${format(date, "1 MMM yyyy", { locale: fr })} - ${format(endDate, "1 MMM yyyy", { locale: fr })}`;
                                                    return (
                                                        <SelectItem key={date.toISOString()} value={date.toISOString()}>
                                                            {dateStr}
                                                        </SelectItem>
                                                    );
                                                })}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Number of People */}
                            <FormField
                                control={step2Form.control}
                                name="numberOfPeople"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nombre de participants</FormLabel>
                                        <div className="flex items-center justify-between border rounded-md p-2">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => field.onChange(Math.max(1, field.value - 1))}
                                                disabled={field.value <= 1}
                                            >
                                                <Minus size={16} />
                                            </Button>
                                            <span className="font-medium">{field.value} {field.value === 1 ? 'personne' : 'personnes'}</span>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => field.onChange(Math.min(20, field.value + 1))}
                                                disabled={field.value >= 20}
                                            >
                                                <Plus size={16} />
                                            </Button>
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Country */}
                            <FormField
                                control={step2Form.control}
                                name="country"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Pays</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Sélectionnez votre pays" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {FRANCOPHONE_COUNTRIES.map((country) => (
                                                    <SelectItem key={country} value={country}>
                                                        {country}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Price Breakdown */}
                            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                                <div className="text-sm font-medium mb-2">
                                    Récapitulatif
                                </div>
                                <div className="text-xs text-muted-foreground space-y-1">
                                    <div className="flex justify-between">
                                        <span>Prix mensuel</span>
                                        <span>${monthlyPrice}/mois</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Durée</span>
                                        <span>{duration} mois</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Total par personne</span>
                                        <span>${priceBreakdown.totalPerPerson.toLocaleString()}</span>
                                    </div>
                                    {numberOfPeople > 1 && (
                                        <div className="flex justify-between">
                                            <span>Participants</span>
                                            <span>× {numberOfPeople}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="border-t pt-2 mt-2 flex justify-between text-sm font-semibold">
                                    <span>Total</span>
                                    <span className="text-primary">${priceBreakdown.grandTotal.toLocaleString()}</span>
                                </div>
                            </div>

                            <Button type="submit" className="w-full" disabled={step2Form.formState.isSubmitting}>
                                {step2Form.formState.isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Envoi en cours...
                                    </>
                                ) : 'Confirmer ma réservation'}
                            </Button>
                            <p className="text-xs text-center text-muted-foreground">
                                Un conseiller vous contactera pour finaliser votre inscription.
                            </p>
                        </form>
                    </Form>
                </div>
            </div>
        );
    }

    // Step 1: Contact info (default)
    return (
        <div key="contact">
            {showHeader && (
                <SheetHeader className="mb-4 text-left">
                    <SheetTitle className="font-headline text-2xl font-normal">Se renseigner</SheetTitle>
                    <SheetDescription>
                        Formation : <span className="font-semibold">{courseName}</span>
                    </SheetDescription>
                </SheetHeader>
            )}
            <div className={cn(!showHeader && "pt-0")}>
                {!showHeader && (
                    <div className="mb-4 text-left">
                        <h3 className="font-headline text-2xl font-normal">Se renseigner</h3>
                    </div>
                )}
                <Form {...step1Form}>
                    <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
                        <FormField
                            control={step1Form.control}
                            name="fullName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nom et prénom</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Votre nom complet" {...field} suppressHydrationWarning />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={step1Form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input placeholder="votre.email@exemple.com" {...field} suppressHydrationWarning />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={step1Form.control}
                            name="phone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Téléphone/WhatsApp</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Votre numéro" {...field} suppressHydrationWarning />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={step1Form.control}
                            name="message"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Message</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Votre message..." className="min-h-[80px]" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex flex-col gap-2 pt-2">
                            <Button
                                type="button"
                                onClick={handleInquiry}
                                disabled={step1Form.formState.isSubmitting}
                            >
                                {step1Form.formState.isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Envoi en cours...
                                    </>
                                ) : 'Se renseigner'}
                            </Button>

                            {isOnline && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleGoToReservation}
                                    className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                                >
                                    Réserver ma place
                                </Button>
                            )}
                        </div>
                    </form>
                </Form>
            </div>
        </div>
    );
}
