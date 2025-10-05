'use client';

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CheckCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

import { useFirestore } from "@/firebase";
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";


const contactFormSchema = z.object({
  fullName: z.string().min(1, { message: "Le nom complet est requis." }),
  email: z.string().email({ message: "Veuillez saisir une adresse e-mail valide." }),
  phone: z.string().optional(),
  message: z.string().min(1, { message: "Le message ne peut pas être vide." }),
});

interface ContactFormProps {
  onFormSubmit: () => void;
  showHeader?: boolean;
}

export function ContactForm({ onFormSubmit, showHeader = false }: ContactFormProps) {
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const firestore = useFirestore();

  const form = useForm<z.infer<typeof contactFormSchema>>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      message: "",
    },
  });

  async function onSubmit(values: z.infer<typeof contactFormSchema>) {
    if (!firestore) {
      console.error("Firestore not available");
      return;
    }

    try {
      const leadsCollection = collection(firestore, 'leads');
      // Here is the key change: adding the leadType field
      await addDoc(leadsCollection, {
        ...values,
        leadType: "Contact Form",
        createdAt: serverTimestamp(),
      });

      form.reset();
      setHasSubmitted(true);
    } catch (error) {
      console.error("Erreur lors de l'envoi du message:", error);
      // You can add a more visible error message here if needed.
    }
  }

  if (hasSubmitted) {
    return (
      <div className="flex flex-col items-center justify-center text-center space-y-4 py-8">
          <CheckCircle className="h-16 w-16 text-green-500" />
          <h3 className="text-xl font-headline font-normal">Message envoyé!</h3>
          <p className="text-xs text-muted-foreground max-w-xs">
            Merci de nous avoir contactés. Nous reviendrons vers vous rapidement.
          </p>
          <Button onClick={onFormSubmit} className="w-full">Fermer</Button>
      </div>
    );
  }
  
  return (
    <>
      {showHeader && (
        <SheetHeader>
            <SheetTitle>Contactez-nous</SheetTitle>
            <SheetDescription>
                Remplissez le formulaire ci-dessous et nous vous répondrons dans les plus brefs délais.
            </SheetDescription>
        </SheetHeader>
      )}
      <div className={cn(showHeader && "py-6")}>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom et prénom</FormLabel>
                  <FormControl>
                    <Input placeholder="Votre nom complet" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="votre.email@exemple.com" {...field} />
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
                  <FormLabel>Téléphone/WhatsApp</FormLabel>
                  <FormControl>
                    <Input placeholder="Votre numéro de téléphone (facultatif)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Comment pouvons-nous vous aider?" className="min-h-[100px]" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Envoi en cours...
                </>
              ) : 'Envoyer'}
            </Button>
          </form>
        </Form>
      </div>
    </>
  )
}