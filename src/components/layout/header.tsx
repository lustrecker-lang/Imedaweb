
"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, CheckCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";


import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { useFirestore, useDoc, addDocumentNonBlocking } from "@/firebase";
import { doc, collection, serverTimestamp } from 'firebase/firestore';
import { cn } from "@/lib/utils";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const navStructure = [
    {
        title: "À propos",
        items: [
            { href: "/about", title: "À propos de nous", description: "Découvrez notre histoire, notre mission et nos valeurs." },
            { href: "#", title: "Carrières", description: "Rejoignez notre équipe et construisons l'avenir ensemble." },
            { href: "#", title: "Présentation", description: "Une vue d'ensemble de nos activités et de notre impact." },
            { href: "#", title: "Références", description: "Voyez comment nous avons aidé nos clients à réussir." },
            { href: "#", title: "Notre approche", description: "Notre méthodologie unique pour des résultats exceptionnels." },
        ]
    },
    {
        title: "Formations",
        items: [
            { href: "#", title: "Catalogue 2025-26", description: "Explorez notre offre complète de formations." },
            { href: "#", title: "700+ Formations internationales", description: "Des programmes de classe mondiale à portée de main." },
            { href: "#", title: "Formations en ligne", description: "Apprenez à votre rythme, où que vous soyez." },
        ]
    },
    {
        title: "Campus",
        items: [
            { href: "#", title: "Dubaï", description: "Étudiez au carrefour de l'innovation et du commerce." },
            { href: "#", title: "Côte d’Azur", description: "Un cadre idyllique pour l'apprentissage et la croissance." },
            { href: "#", title: "Paris", description: "Plongez au cœur de la culture et de l'éducation européennes." },
        ]
    },
    {
        title: "Autre",
        items: [
            { href: "#", title: "Services", description: "Des solutions sur mesure pour les entreprises." },
            { href: "#", title: "Publications", description: "Nos dernières recherches, articles et livres blancs." },
            { href: "#", title: "Partenariats d'entreprise", description: "Collaborez avec nous pour un succès mutuel." },
            { href: "#", title: "Actualités et Mises à jour", description: "Restez informé des dernières nouvelles de notre institution." },
        ]
    }
];

const contactFormSchema = z.object({
  fullName: z.string().min(1, { message: "Le nom complet est requis." }),
  email: z.string().email({ message: "Veuillez saisir une adresse e-mail valide." }),
  phone: z.string().optional(),
  message: z.string().min(1, { message: "Le message ne peut pas être vide." }),
});

function ContactForm({ onFormSubmit, setHasSubmitted }: { onFormSubmit: () => void; setHasSubmitted: (hasSubmitted: boolean) => void }) {
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
    
    const leadsCollection = collection(firestore, 'leads');
    addDocumentNonBlocking(leadsCollection, {
      ...values,
      createdAt: serverTimestamp(),
    });

    form.reset();
    setHasSubmitted(true);
  }
  
  return (
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
          {form.formState.isSubmitting ? 'Envoi en cours...' : 'Envoyer'}
        </Button>
      </form>
    </Form>
  )
}

interface CompanyProfile {
  name?: string;
  logoUrl?: string;
}

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a"> & { description: string }
>(({ className, title, description, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <Link
          href={props.href || '#'}
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-background/80 hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className
          )}
          {...props}
        >
          <div className="text-sm font-normal leading-none">{title}</div>
          <p className="line-clamp-2 text-xs leading-snug text-muted-foreground">
            {description}
          </p>
        </Link>
      </NavigationMenuLink>
    </li>
  );
});
ListItem.displayName = "ListItem";


export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [isContactSheetOpen, setIsContactSheetOpen] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const firestore = useFirestore();

  const companyProfileRef = useMemo(() => {
    if (!firestore) return null;
    return doc(firestore, 'companyProfile', 'main');
  }, [firestore]);

  const { data: companyProfile, isLoading } = useDoc<CompanyProfile>(companyProfileRef);

  const LogoComponent = () => {
    if (isLoading) {
      return <Skeleton className="h-6 w-24" />;
    }
    if (companyProfile?.logoUrl) {
      return <Image src={companyProfile.logoUrl} alt={companyProfile.name || 'Company Logo'} width={100} height={24} className="h-6 w-auto object-contain" />;
    }
    if(companyProfile?.name) {
      return <span className="text-sm font-semibold tracking-wider font-headline">{companyProfile.name}</span>;
    }
    return <div className="h-6 w-24" />; // Empty div as a fallback to prevent layout shift
  }
  
  const handleSheetOpenChange = (open: boolean) => {
      setIsContactSheetOpen(open);
      if (!open) {
          // Reset form state when sheet closes
          setTimeout(() => setHasSubmitted(false), 300);
      }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-sm">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <LogoComponent />
        </Link>
        
        <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>
                {navStructure.map((category) => (
                    <NavigationMenuItem key={category.title}>
                        <NavigationMenuTrigger variant="ghost">{category.title}</NavigationMenuTrigger>
                        <NavigationMenuContent>
                        <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] ">
                            {category.items.map((item) => (
                                <ListItem
                                    key={item.title}
                                    href={item.href}
                                    title={item.title}
                                    description={item.description}
                                />
                            ))}
                        </ul>
                        </NavigationMenuContent>
                    </NavigationMenuItem>
                ))}
            </NavigationMenuList>
        </NavigationMenu>

        <div className="flex items-center gap-2">
            <Sheet open={isContactSheetOpen} onOpenChange={handleSheetOpenChange}>
                <SheetTrigger asChild>
                    <Button size="sm" className="hidden md:inline-flex">
                        Contactez-nous
                    </Button>
                </SheetTrigger>
                <SheetContent side="right">
                    {!hasSubmitted && (
                      <SheetHeader>
                          <SheetTitle>Contactez-nous</SheetTitle>
                          <SheetDescription>
                              Remplissez le formulaire ci-dessous et nous vous répondrons dans les plus brefs délais.
                          </SheetDescription>
                      </SheetHeader>
                    )}
                    <div className="py-6">
                        {hasSubmitted ? (
                             <div className="flex flex-col items-center justify-center text-center space-y-4 py-8">
                                <CheckCircle className="h-16 w-16 text-green-500" />
                                <h3 className="text-xl font-headline font-normal">Message envoyé!</h3>
                                <p className="text-xs text-muted-foreground">
                                  Merci de nous avoir contactés. Nous reviendrons vers vous rapidement.
                                </p>
                                <Button onClick={() => handleSheetOpenChange(false)} className="w-full">Fermer</Button>
                            </div>
                        ) : (
                           <ContactForm onFormSubmit={() => handleSheetOpenChange(false)} setHasSubmitted={setHasSubmitted} />
                        )}
                    </div>
                </SheetContent>
            </Sheet>
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full max-w-sm">
              <SheetHeader className="p-6">
                  <SheetTitle className="sr-only">Menu</SheetTitle>
                  <SheetDescription className="sr-only">Main navigation menu for the website.</SheetDescription>
                <Link href="/" className="flex items-center gap-2" onClick={() => setIsOpen(false)}>
                  <LogoComponent />
                </Link>
              </SheetHeader>
              <div className="grid gap-4 px-6">
                <nav className="grid gap-2 text-base font-normal">
                    <Accordion type="multiple" className="w-full">
                       {navStructure.map((category) => (
                         <AccordionItem key={category.title} value={category.title} className="border-b-0">
                           <AccordionTrigger className="py-2 text-foreground/70 transition-colors hover:text-foreground hover:no-underline font-normal">
                             {category.title}
                           </AccordionTrigger>
                           <AccordionContent className="pl-4">
                              <div className="flex flex-col gap-2 mt-2">
                                {category.items.map((link) => (
                                    <Link
                                        key={link.title}
                                        href={link.href}
                                        className="block py-1 text-foreground/70 transition-colors hover:text-foreground font-normal"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        {link.title}
                                    </Link>
                                ))}
                              </div>
                           </AccordionContent>
                         </AccordionItem>
                       ))}
                    </Accordion>
                </nav>
                 <Sheet open={isContactSheetOpen} onOpenChange={handleSheetOpenChange}>
                    <SheetTrigger asChild>
                        <Button className="w-full" onClick={() => { setIsOpen(false); setIsContactSheetOpen(true); }}>Contactez-nous</Button>
                    </SheetTrigger>
                </Sheet>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

    