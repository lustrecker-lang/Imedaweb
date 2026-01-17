
'use client';

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Image from "next/image";
import { Download, Loader2, CheckCircle } from "lucide-react";

import { useFirestore, addDocumentNonBlocking } from "@/firebase";
import { collection, serverTimestamp } from 'firebase/firestore';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const catalogFormSchema = z.object({
    email: z.string().email({ message: "Veuillez saisir une adresse e-mail valide." }),
    phone: z.string().optional(),
});

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

interface CatalogViewProps {
    pageData: Page | null;
}


export default function CatalogView({ pageData }: CatalogViewProps) {
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const firestore = useFirestore();
    const { toast } = useToast();

    const heroSection = pageData?.sections.find(s => s.id === 'hero');

    const form = useForm<z.infer<typeof catalogFormSchema>>({
        resolver: zodResolver(catalogFormSchema),
        defaultValues: { email: "", phone: "" },
    });

    const { formState: { isSubmitting } } = form;

    const handleDownload = async (values: z.infer<typeof catalogFormSchema>) => {
        if (!firestore) {
            toast({ variant: "destructive", title: "Erreur", description: "Le service de base de données n'est pas disponible." });
            return;
        }

        try {
            await addDocumentNonBlocking(collection(firestore, 'leads'), {
                email: values.email,
                phone: values.phone,
                leadType: 'Catalog Download',
                fullName: 'Catalog Lead (Page)',
                message: 'Catalog Download Request from Catalog page.',
                createdAt: serverTimestamp(),
            });

            // Fire Google Ads conversion event
            if (typeof window !== 'undefined' && (window as any).gtag) {
                // Signal 1: Google Ads (Medium Value Conversion)
                (window as any).gtag('event', 'conversion', {
                    'send_to': 'AW-17882391668/-mr-CMbbnOcbEPTI_s5C',
                    'value': 20.0,
                    'currency': 'AED',
                });

                // Signal 2: Google Analytics (File Download Event)
                (window as any).gtag('event', 'file_download', {
                    'file_name': 'Catalog 2026',
                    'link_text': 'Download Catalog Form'
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
            toast({ variant: "destructive", title: "Erreur", description: "Impossible de traiter votre demande de téléchargement de catalogue." });
        }
    };

    const handleResetForm = () => {
        setHasSubmitted(false);
        form.reset();
    };

    return (
        <div className="container mx-auto max-w-4xl px-4 py-12 md:px-6 flex items-center justify-center min-h-[calc(100vh-10rem)]">
            <Card className="w-full overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div className="p-8 order-2 md:order-1">
                        {hasSubmitted ? (
                            <div className="flex flex-col items-center justify-center text-center space-y-4 py-8">
                                <CheckCircle className="h-16 w-16 text-green-500" />
                                <h3 className="text-xl font-headline font-normal">Merci!</h3>
                                <p className="text-sm text-muted-foreground max-w-xs">
                                    Votre téléchargement a commencé.
                                </p>
                                <Button variant="outline" onClick={handleResetForm} className="mt-4">Télécharger à nouveau</Button>
                            </div>
                        ) : (
                            <>
                                <CardHeader className="p-0 text-left">
                                    <CardTitle className="font-headline text-2xl font-normal">{heroSection?.title || 'Télécharger le catalogue'}</CardTitle>
                                    <CardDescription>{heroSection?.content || 'Entrez votre e-mail pour recevoir le catalogue complet de nos formations 2026.'}</CardDescription>
                                </CardHeader>
                                <div className="mt-6">
                                    <Form {...form}>
                                        <form onSubmit={form.handleSubmit(handleDownload)} className="space-y-4">
                                            <FormField
                                                control={form.control}
                                                name="email"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormControl>
                                                            <Input placeholder="Votre adresse email" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="phone"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormControl>
                                                            <Input placeholder="Téléphone/WhatsApp (facultatif)" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                                                {isSubmitting ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        En cours...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Download className="mr-2 h-4 w-4" />
                                                        Télécharger
                                                    </>
                                                )}
                                            </Button>
                                        </form>
                                    </Form>
                                </div>
                            </>
                        )}
                    </div>
                    <div className="relative aspect-[3/4] w-full order-1 md:order-2">
                        {heroSection?.imageUrl ? (
                            <Image
                                src={heroSection.imageUrl}
                                alt="Catalogue"
                                fill
                                className="object-cover"
                                data-ai-hint="professional education catalog"
                            />
                        ) : (
                            <Skeleton className="h-full w-full" />
                        )}
                    </div>
                </div>
            </Card>
        </div>
    );
}
