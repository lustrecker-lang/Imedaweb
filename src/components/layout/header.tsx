"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
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
import { useFirestore, useDoc } from "@/firebase";
import { doc } from 'firebase/firestore';
import { cn } from "@/lib/utils";


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
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
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

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-sm">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <LogoComponent />
        </Link>
        
        <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>
                <NavigationMenuItem>
                    <NavigationMenuLink asChild>
                        <Link href="/" className={cn(navigationMenuTriggerStyle({variant: "ghost"}), "bg-transparent")}>
                            Accueil
                        </Link>
                    </NavigationMenuLink>
                </NavigationMenuItem>
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
           <Button size="sm" asChild className="hidden md:inline-flex">
              <Link href="#">Contact Us</Link>
            </Button>
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full max-w-sm">
              <div className="grid gap-4 p-6">
                <Link href="/" className="flex items-center gap-2" onClick={() => setIsOpen(false)}>
                  <LogoComponent />
                </Link>
                <nav className="grid gap-2 text-base font-normal">
                    <Link
                        href="/"
                        className="block py-2 text-foreground/70 transition-colors hover:text-foreground"
                        onClick={() => setIsOpen(false)}
                    >
                        Accueil
                    </Link>
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
                 <Button asChild className="w-full">
                    <Link href="#" onClick={() => setIsOpen(false)}>Contact Us</Link>
                  </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
