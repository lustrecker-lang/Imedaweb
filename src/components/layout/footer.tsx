'use client';
import Link from "next/link";
import { Linkedin, Twitter, Facebook, Mountain } from "lucide-react";
import { useFirestore, useDoc } from "@/firebase";
import { useMemo } from "react";
import { doc } from "firebase/firestore";

interface CompanyProfile {
  name?: string;
  iconSvg?: string;
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
      <div className="container mx-auto px-4 py-8 md:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-2">
             <Link href="/" className="flex items-center gap-2">
                {companyProfile?.iconSvg ? (
                  <div
                    className="h-6 w-6 text-primary"
                    dangerouslySetInnerHTML={{ __html: companyProfile.iconSvg }}
                  />
                ) : (
                  <Mountain className="h-6 w-6 text-primary" />
                )}
                <span className="text-base font-semibold tracking-wider font-headline">{companyProfile?.name || 'IMEDA'}</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Elevate your business operations to the next level.
            </p>
          </div>
          <div>
            <h3 className="text-xs font-semibold tracking-wider uppercase">Quick Links</h3>
            <ul className="mt-4 space-y-2">
              <li><Link href="/" className="text-sm text-muted-foreground hover:text-foreground">Home</Link></li>
              <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground">About</Link></li>
              <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground">Services</Link></li>
              <li><Link href="#" className="text-sm text-muted-foreground hovertext-foreground">Contact</Link></li>
            </ul>
          </div>
          <div>
             <h3 className="text-xs font-semibold tracking-wider uppercase">Legal</h3>
            <ul className="mt-4 space-y-2">
              <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground">Terms of Service</Link></li>
              <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground">Privacy Policy</Link></li>
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
        <div className="mt-8 border-t pt-6 text-center">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} {companyProfile?.name || 'IMEDA'}. All rights reserved.
            </p>
        </div>
      </div>
    </footer>
  );
}
