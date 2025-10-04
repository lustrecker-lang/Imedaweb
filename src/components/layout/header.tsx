"use client";

import Link from "next/link";
import { Menu, ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useFirestore, useDoc } from "@/firebase";
import { doc } from 'firebase/firestore';
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";


const navStructure = [
    {
        title: "À propos",
        links: [
            { href: "/about", label: "À propos de nous" },
            { href: "#", label: "Carrières" },
            { href: "#", label: "Présentation" },
            { href: "#", label: "Références" },
            { href: "#", label: "Notre approche" },
        ]
    },
    {
        title: "Formations",
        links: [
            { href: "#", label: "Catalogue 2025-26" },
            { href: "#", label: "700+ Formations internationales" },
            { href: "#", label: "Formations en ligne" },
        ]
    },
    {
        title: "Campus",
        links: [
            { href: "#", label: "Dubaï" },
            { href: "#", label: "Côte d’Azur" },
            { href: "#", label: "Paris" },
        ]
    },
    {
        title: "Autre",
        links: [
            { href: "#", label: "Services" },
            { href: "#", label: "Publications" },
            { href: "#", label: "Partenariats d'entreprise" },
            { href: "#", label: "Actualités et Mises à jour" },
        ]
    }
];

interface CompanyProfile {
  name?: string;
  logoUrl?: string;
}

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
        <nav className="hidden items-center gap-1 text-xs font-medium md:flex">
          <Button variant="ghost" size="sm" asChild>
              <Link href="/" className="text-foreground/70 transition-colors hover:text-foreground">
                Accueil
              </Link>
          </Button>
          {navStructure.map((category) => (
            <DropdownMenu key={category.title}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1 text-foreground/70 transition-colors hover:text-foreground">
                  {category.title}
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {category.links.map((link) => (
                  <DropdownMenuItem key={link.label} asChild>
                    <Link href={link.href}>{link.label}</Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ))}
        </nav>
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
                <nav className="grid gap-2 text-base font-medium">
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
                           <AccordionTrigger className="py-2 text-foreground/70 transition-colors hover:text-foreground hover:no-underline">
                             {category.title}
                           </AccordionTrigger>
                           <AccordionContent className="pl-4">
                              <div className="flex flex-col gap-2 mt-2">
                                {category.links.map((link) => (
                                    <Link
                                        key={link.label}
                                        href={link.href}
                                        className="block py-1 text-foreground/70 transition-colors hover:text-foreground"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        {link.label}
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
