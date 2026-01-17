
"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetClose } from "@/components/ui/sheet";
import {
  Menubar,
  MenubarContent,
  MenubarMenu,
  MenubarTrigger,
} from "@/components/ui/menubar";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ContactForm } from "@/components/contact-form";

const formationsNavStructure = {
  title: "Formations",
  items: [
    { href: "/catalog", title: "Catalogue 2026", description: "Téléchargez notre catalogue complet pour la saison à venir." },
    { href: "/courses", title: "700+ Formations internationales", description: "Explorez notre catalogue complet de formations internationales." },
    { href: "/online", title: "Formations en ligne", description: "Apprenez à votre rythme avec nos cours en ligne." },
  ]
};

const navStructure = [
  {
    title: "À propos",
    items: [
      { href: "/presentation", title: "Présentation", description: "Une vue d'ensemble de nos activités et de notre impact." },
      { href: "/careers", title: "Carrières", description: "Rejoignez notre équipe et construisons l'avenir ensemble." },
      { href: "/notre-approche", title: "Notre approche", description: "Notre méthodologie unique pour des résultats exceptionnels." },
      { href: "/references", title: "Références", description: "Voyez comment nous avons aidé nos clients à réussir." },
    ]
  },
  {
    title: "Autre",
    items: [
      { href: "/services", title: "Services", description: "Des solutions sur mesure pour les entreprises." },
      { href: "/publications", title: "Publications", description: "Nos dernières recherches, articles et livres blancs." },
      { href: "/partenariats", title: "Partenariats d'entreprise", description: "Collaborez avec nous pour un succès mutuel." },
      { href: "/news", title: "Actualités", description: "Restez informé des dernières nouvelles de notre institution." },
    ]
  }
];

interface CompanyProfile {
  name?: string;
  logoUrl?: string;
  logoLightUrl?: string;
}

interface Campus {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
}

interface HeaderProps {
  companyProfile: CompanyProfile | null;
  campuses: Campus[];
}

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a"> & { description?: string; href: string }
>(({ className, title, description, href, ...props }, ref) => {
  const defaultHref = href || "#";
  return (
    <Link
      ref={ref}
      className={cn(
        "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-all hover:bg-primary/5 hover:shadow-sm hover:border-primary/20 border border-transparent w-full text-left",
        className
      )}
      href={defaultHref}
      {...props}
    >
      <div className="text-sm font-normal leading-none">{title}</div>
      {description && (
        <p className="line-clamp-2 text-xs leading-snug text-muted-foreground">
          {description}
        </p>
      )}
    </Link>
  );
});
ListItem.displayName = "ListItem";


export function Header({ companyProfile, campuses }: HeaderProps) {
  const [isMobileNavOpen, setIsMobileNavOpen] = React.useState(false);
  const [isContactSheetOpen, setIsContactSheetOpen] = React.useState(false);

  const LogoComponent = () => {
    const fixedWidth = 'w-[96px]';
    const fixedHeight = 'h-6';

    if (companyProfile?.logoUrl) {
      return (
        <div className={`relative ${fixedHeight} ${fixedWidth}`}>
          <Image
            src={companyProfile.logoUrl}
            alt={companyProfile.name || 'Company Logo'}
            fill
            className="object-contain"
            priority={true}
            sizes="96px"
          />
        </div>
      );
    }
    if (companyProfile?.name) {
      return <span className={`text-sm font-semibold tracking-wider font-headline ${fixedHeight} leading-6`}>{companyProfile.name}</span>;
    }
    return <Skeleton className={`${fixedHeight} ${fixedWidth}`} />;
  }

  const DesktopContactButton = () => (
    <Sheet open={isContactSheetOpen} onOpenChange={setIsContactSheetOpen}>
      <SheetTrigger asChild>
        <Button size="sm" className="hidden md:inline-flex">
          Contactez-nous
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-sm overflow-y-auto pb-12">
        <ContactForm onFormSubmit={() => setIsContactSheetOpen(false)} showHeader={true} />
      </SheetContent>
    </Sheet>
  );

  const campusNav = {
    title: "Campus",
    items: campuses ? campuses.map(campus => ({
      href: `/campus/${campus.slug}`,
      title: campus.name,
      description: campus.description || `Découvrez notre campus à ${campus.name}.`
    })) : []
  };

  const finalNavStructure = [formationsNavStructure, navStructure[0], campusNav, ...navStructure.slice(1)];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-sm">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <LogoComponent />
        </Link>

        <Menubar className="hidden md:flex border-none bg-transparent shadow-none p-0">
          {finalNavStructure.map((category) => (
            <MenubarMenu key={category.title}>
              <MenubarTrigger className="font-normal cursor-pointer hover:bg-card hover:text-foreground data-[state=open]:bg-card data-[state=open]:text-foreground transition-colors">
                {category.title}
                <ChevronDown className="ml-1 h-3 w-3 transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </MenubarTrigger>
              <MenubarContent align="center" className="bg-card">
                <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] outline-none">
                  {category.items.map((item) => (
                    <ListItem
                      key={item.title}
                      href={item.href}
                      title={item.title}
                      description={item.description}
                    />
                  ))}
                </ul>
              </MenubarContent>
            </MenubarMenu>
          ))}
        </Menubar>

        <div className="flex items-center gap-2">
          <DesktopContactButton />
          <Sheet open={isMobileNavOpen} onOpenChange={setIsMobileNavOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full max-w-sm flex flex-col p-0" hideClose>
              <div className="flex h-16 items-center justify-between border-b px-6">
                <SheetTitle className="sr-only">Mobile Navigation Menu</SheetTitle>
                <Link href="/" className="flex items-center gap-2" onClick={() => setIsMobileNavOpen(false)}>
                  <LogoComponent />
                </Link>
                <SheetClose asChild>
                  <Button variant="ghost" size="icon">
                    <X className="h-6 w-6" />
                    <span className="sr-only">Close menu</span>
                  </Button>
                </SheetClose>
              </div>

              <div className="p-6 pb-0 flex-grow overflow-y-auto">
                <div className="grid gap-4">
                  <nav className="grid gap-2 text-base font-normal">
                    <Accordion type="multiple" className="w-full">
                      {finalNavStructure.map((category) => (
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
                                  onClick={() => setIsMobileNavOpen(false)}
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
                </div>
              </div>
              <div className="mt-auto p-6 border-t">
                <Button size="sm" className="w-full" onClick={() => {
                  setIsMobileNavOpen(false);
                  setIsContactSheetOpen(true);
                }}>
                  Contactez-nous
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
