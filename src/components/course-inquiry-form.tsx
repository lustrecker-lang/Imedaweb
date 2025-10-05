
'use client';

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CheckCircle } from "lucide-react";
import { useFirestore, addDocumentNonBlocking } from "@/firebase";
import { collection, serverTimestamp } from 'firebase/firestore';

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";

const inquiryFormSchema = z.object({
  fullName: z.string().min(1, { message: "Le nom complet est requis." }),
  email: z.string().email({ message: "Veuillez saisir une adresse e-mail valide." }),
  phone: z.string().optional(),
  message: z.string().optional(),
});

interface CourseInquiryFormProps {
  courseName: string;
}

export function CourseInquiryForm({ courseName }: CourseInquiryFormProps) {
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const firestore = useFirestore();

  const form = useForm<z.infer<typeof inquiryFormSchema>>({
    resolver: zodResolver(inquiryFormSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      message: "",
    },
  });

  async function onSubmit(values: z.infer<typeof inquiryFormSchema>) {
    if (!firestore) {
      console.error("Firestore not available");
      return;
    }
    
    const leadsCollection = collection(firestore, 'leads');
    addDocumentNonBlocking(leadsCollection, {
      ...values,
      leadType: "Course Inquiry",
      courseName: courseName,
      createdAt: serverTimestamp(),
    });

    setHasSubmitted(true);
  }

  if (hasSubmitted) {
    return (
      <div className="flex flex-col items-center justify-center text-center space-y-4 py-8">
          <CheckCircle className="h-16 w-16 text-green-500" />
          <h3 className="text-xl font-headline font-normal">Demande envoyée!</h3>
          <p className="text-xs text-muted-foreground max-w-xs">
            Merci! Un de nos conseillers vous contactera sous peu.
          </p>
      </div>
    );
  }
  
  return (
    <>
        <SheetHeader className="mb-4 text-left">
            <SheetTitle className="font-headline text-2xl font-normal">Se renseigner</SheetTitle>
            <SheetDescription>
                Remplissez le formulaire pour le cours : <span className="font-semibold">{courseName}</span>.
            </SheetDescription>
        </SheetHeader>
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
                    <Input placeholder="Votre numéro" {...field} />
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
                  <FormLabel>Message (facultatif)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Votre message..." className="min-h-[100px]" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Envoi en cours...' : 'Se renseigner'}
            </Button>
          </form>
        </Form>
    </>
  )
}
