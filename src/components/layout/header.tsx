"use client";

import Link from "next/link";
import { Menu, Mountain } from "lucide-react";
import { useMemo, useState } from "react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useUser, useFirestore, useDoc } from "@/firebase";
import { doc } from 'firebase/firestore';

const navLinks = [
  { href: "/", label: "Home" },
  { href: "#", label: "About" },
  { href: "#", label: "Services" },
  { href: "#", label: "Contact" },
];

interface CompanyProfile {
  name?: string;
  logoUrl?: string;
}

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const companyProfileRef = useMemo(() => {
    if (!firestore) return null;
    return doc(firestore, 'companyProfile', 'main');
  }, [firestore]);

  const { data: companyProfile } = useDoc<CompanyProfile>(companyProfileRef);

  const LogoComponent = () => {
    if (companyProfile?.logoUrl) {
      return <Image src={companyProfile.logoUrl} alt={companyProfile.name || 'Company Logo'} width={100} height={24} className="h-6 w-auto object-contain" />;
    }
    if(companyProfile?.name) {
      return <span className="text-sm font-semibold tracking-wider font-headline">{companyProfile.name}</span>;
    }
    return (
      <>
        <Mountain className="h-6 w-6 text-primary" />
        <span className="text-sm font-semibold tracking-wider font-headline">IMEDA</span>
      </>
    )
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-sm">
      <div className="container flex h-16 max-w-[1400px] items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <LogoComponent />
        </Link>
        <nav className="hidden items-center gap-6 text-xs font-medium md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-foreground/70 transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
           { !isUserLoading && user && (
            <Link href="/admin/dashboard" className="text-foreground/70 transition-colors hover:text-foreground">
              Dashboard
            </Link>
          )}
        </nav>
        <div className="flex items-center gap-2">
           { !isUserLoading && !user && (
              <Button variant="outline" size="sm" asChild className="hidden md:inline-flex">
                <Link href="/login">Editor Login</Link>
              </Button>
            )
           }
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <div className="grid gap-4 p-6">
                <Link href="/" className="flex items-center gap-2" onClick={() => setIsOpen(false)}>
                  <LogoComponent />
                </Link>
                <nav className="grid gap-2 text-base font-medium">
                    {navLinks.map((link) => (
                        <Link
                            key={link.label}
                            href={link.href}
                            className="block py-2 text-foreground/70 transition-colors hover:text-foreground"
                            onClick={() => setIsOpen(false)}
                        >
                            {link.label}
                        </Link>
                    ))}
                    { !isUserLoading && user && (
                      <Link href="/admin/dashboard" className="block py-2 text-foreground/70 transition-colors hover:text-foreground" onClick={() => setIsOpen(false)}>
                        Dashboard
                      </Link>
                    )}
                </nav>
                 { !isUserLoading && !user && (
                      <Button asChild className="w-full">
                        <Link href="/login" onClick={() => setIsOpen(false)}>Editor Login</Link>
                      </Button>
                    )
                 }
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
