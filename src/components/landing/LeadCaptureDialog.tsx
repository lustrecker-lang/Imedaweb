
"use client";

import { useState } from 'react';
import { useMediaQuery } from 'react-responsive';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { MessageCircle, Loader2 } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useFirestore } from '@/firebase/provider'; // Assuming this provides the db instance

interface LeadCaptureDialogProps {
    children: React.ReactNode;
    landingPageSlug: string;
}

export function LeadCaptureDialog({ children, landingPageSlug }: LeadCaptureDialogProps) {
    const [open, setOpen] = useState(false);
    const isDesktop = useMediaQuery({ query: '(min-width: 768px)' });
    const firestore = useFirestore();

    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !phone) return;

        setIsSubmitting(true);
        try {
            // Save lead to Firestore
            if (firestore) {
                await addDoc(collection(firestore, 'leads'), {
                    name,
                    phone,
                    leadType: 'Landing Page WhatsApp',
                    sourcePage: landingPageSlug,
                    createdAt: serverTimestamp(),
                });
            }

            // Redirect to WhatsApp
            window.open('https://wa.me/33651653144', '_blank');
            setOpen(false);
            setName('');
            setPhone('');
        } catch (error) {
            console.error('Error saving lead:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const FormContent = (
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
                <Label htmlFor="name">Nom complet</Label>
                <Input
                    id="name"
                    placeholder="Votre nom"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="rounded-none"
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="phone">Numéro de téléphone</Label>
                <Input
                    id="phone"
                    type="tel"
                    placeholder="Votre numéro (ex: +33 6 ...)"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="rounded-none"
                />
            </div>
            <Button
                type="submit"
                className="w-full rounded-none"
                disabled={isSubmitting}
            >
                {isSubmitting ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Traitement...
                    </>
                ) : (
                    <>
                        <MessageCircle className="mr-2 h-4 w-4" />
                        Continuer vers WhatsApp
                    </>
                )}
            </Button>
        </form>
    );

    if (isDesktop) {
        return (
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    {children}
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] rounded-none">
                    <DialogHeader>
                        <DialogTitle>Discuter avec nous</DialogTitle>
                        <DialogDescription>
                            Laissez-nous vos coordonnées pour démarrer la conversation sur WhatsApp.
                        </DialogDescription>
                    </DialogHeader>
                    {FormContent}
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                {children}
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-xl">
                <SheetHeader>
                    <SheetTitle>Discuter avec nous</SheetTitle>
                    <SheetDescription>
                        Laissez-nous vos coordonnées pour démarrer la conversation sur WhatsApp.
                    </SheetDescription>
                </SheetHeader>
                {FormContent}
            </SheetContent>
        </Sheet>
    );
}
