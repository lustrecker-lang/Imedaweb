"use client";

import Link from "next/link";
import { Menu, Mountain } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useUser } from "@/firebase";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "#", label: "About" },
  { href: "#", label: "Services" },
  { href: "#", label: "Contact" },
];

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isUserLoading } = useUser();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-sm">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <Mountain className="h-6 w-6 text-primary" />
          <span className="text-base font-semibold tracking-wider font-headline">IMEDA</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
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
                  <Mountain className="h-6 w-6 text-primary" />
                  <span className="text-base font-semibold tracking-wider font-headline">IMEDA</span>
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
