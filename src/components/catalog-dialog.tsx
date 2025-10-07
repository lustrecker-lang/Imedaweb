// src/components/catalog-dialog.tsx
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

const catalogFormSchema = z.object({
  email: z.string().email({ message: "Veuillez saisir une adresse e-mail valide." }),
});

export function CatalogDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const isMobile = useIsMobile();
  const firestore = useFirestore();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof catalogFormSchema>>({
    resolver: zodResolver(catalogFormSchema),
    defaultValues: {
      email: "",
    },
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
          leadType: 'Catalog Download',
          fullName: 'Catalog Lead (Dialog)',
          message: 'Catalog Download Request from Header/Footer Dialog.',
          createdAt: serverTimestamp(),
      });
      
      const link = document.createElement('a');
      link.href = '/api/download-catalog';
      link.download = 'IMEDA-Catalogue-2025-26.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setHasSubmitted(true);
      
      setTimeout(() => {
        setOpen(false);
        setTimeout(() => {
            form.reset();
            setHasSubmitted(false);
        }, 300);
      }, 2000);

    } catch (error) {
      console.error("Error submitting lead:", error);
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de traiter votre demande de téléchargement de catalogue." });
    }
  };

  const DialogBody = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center p-6 sm:p-8">
      <div className="order-2 md:order-1">
        {hasSubmitted ? (
            <div className="flex flex-col items-center justify-center text-center space-y-4 py-8">
              <CheckCircle className="h-16 w-16 text-green-500" />
              <h3 className="text-xl font-headline font-normal">Merci!</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                Votre téléchargement a commencé. La fenêtre se fermera automatiquement.
              </p>
            </div>
        ) : (
          <>
            <DialogHeader className="text-left p-0">
              <DialogTitle className="font-headline text-2xl font-normal">Télécharger le catalogue</DialogTitle>
            </DialogHeader>
            <div className="mt-4">
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
      <div className="order-1 md:order-2">
        <div className="relative aspect-square w-full rounded-lg overflow-hidden">
          <Image
            src="https://picsum.photos/seed/catalog-dialog/600/600"
            alt="Catalogue"
            fill
            className="object-cover"
            data-ai-hint="professional education catalog"
          />
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>{children}</SheetTrigger>
        <SheetContent side="bottom" className="h-auto p-0 rounded-t-lg">
          <DialogBody />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-3xl p-0">
        <DialogBody />
      </DialogContent>
    </Dialog>
  );
}
