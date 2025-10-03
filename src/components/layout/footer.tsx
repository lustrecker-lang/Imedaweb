'use client';
import Link from "next/link";
import { Linkedin, Twitter, Facebook, Mountain } from "lucide-react";
import { useFirestore, useDoc } from "@/firebase";
import { useMemo } from "react";
import { doc } from "firebase/firestore";
import Image from "next/image";
import { Button } from "../ui/button";

interface CompanyProfile {
  name?: string;
  iconUrl?: string;
}


export function Footer() {
  const firestore = useFirestore();
  const companyProfileRef = useMemo(() => {
    if (!firestore) return null;
    return doc(firestore, 'companyProfile', 'main');
  }, [firestore]);

  const { data: companyProfile } = useDoc<CompanyProfile>(companyProfileRef);

  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto max-w-[1400px] px-4 py-8 md:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-2">
             <Link href="/" className="flex items-center gap-2">
                {companyProfile?.iconUrl ? (
                  <Image
                    src={companyProfile.iconUrl}
                    alt={companyProfile.name || 'Company Icon'}
                    width={24}
                    height={24}
                    className="object-contain"
                  />
                ) : (
                  <Mountain className="h-6 w-6 text-primary" />
                )}
                <span className="text-sm font-semibold tracking-wider font-headline">{companyProfile?.name || 'IMEDA'}</span>
            </Link>
            <p className="text-xs text-muted-foreground">
              Elevate your business operations to the next level.
            </p>
          </div>
          <div>
            <h3 className="text-xs font-semibold tracking-wider uppercase">Quick Links</h3>
            <ul className="mt-4 space-y-2">
              <li><Link href="/" className="text-xs text-muted-foreground hover:text-foreground">Home</Link></li>
              <li><Link href="#" className="text-xs text-muted-foreground hover:text-foreground">About</Link></li>
              <li><Link href="#" className="text-xs text-muted-foreground hover:text-foreground">Services</Link></li>
              <li><Link href="#" className="text-xs text-muted-foreground hover:text-foreground">Contact</Link></li>
            </ul>
          </div>
          <div>
             <h3 className="text-xs font-semibold tracking-wider uppercase">Legal</h3>
            <ul className="mt-4 space-y-2">
              <li><Link href="#" className="text-xs text-muted-foreground hover:text-foreground">Terms of Service</Link></li>
              <li><Link href="#" className="text-xs text-muted-foreground hover:text-foreground">Privacy Policy</Link></li>
            </ul>
          </div>
          <div>
             <h3 className="text-xs font-semibold tracking-wider uppercase">Follow Us</h3>
             <div className="mt-4 flex items-center gap-4">
              <Link href="#" aria-label="Twitter">
                <Twitter className="h-5 w-5 text-muted-foreground transition-colors hover:text-primary" />
              </Link>
              <Link href="#" aria-label="LinkedIn">
                <Linkedin className="h-5 w-5 text-muted-foreground transition-colors hover:text-primary" />
              </Link>
              <Link href="#" aria-label="Facebook">
                <Facebook className="h-5 w-5 text-muted-foreground transition-colors hover:text-primary" />
              </Link>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t pt-6 flex flex-col items-center gap-4">
          <div className="flex gap-4">
             <Button variant="outline" size="sm" asChild>
                <Link href="/login">Editor Login</Link>
              </Button>
          </div>
        </div>
        <div className="mt-8 border-t pt-6 text-center">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} {companyProfile?.name || 'IMEDA'}. All rights reserved.
            </p>
        </div>
      </div>
    </footer>
  );
}
