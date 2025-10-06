'use client';
import Link from "next/link";
import { Instagram, Youtube } from "lucide-react";
import Image from "next/image";

interface CompanyProfile {
  name?: string;
  logoUrl?: string;
}

interface Campus {
  id: string;
  name: string;
  slug: string;
}

interface FooterProps {
  companyProfile: CompanyProfile | null;
  campuses: Campus[];
}

export function Footer({ companyProfile, campuses }: FooterProps) {
  return (
    <footer className="border-t bg-white">
      <div className="container mx-auto max-w-[1400px] px-4 py-8 md:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <h3 className="text-xs font-semibold tracking-wider uppercase">À propos</h3>
            <ul className="mt-4 space-y-2">
              <li><Link href="/about" className="text-xs text-muted-foreground hover:text-foreground">À propos de nous</Link></li>
              <li><Link href="#" className="text-xs text-muted-foreground hover:text-foreground">Carrières</Link></li>
              <li><Link href="#" className="text-xs text-muted-foreground hover:text-foreground">Présentation</Link></li>
              <li><Link href="#" className="text-xs text-muted-foreground hover:text-foreground">Références</Link></li>
              <li><Link href="#" className="text-xs text-muted-foreground hover:text-foreground">Notre approche</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-semibold tracking-wider uppercase">Formations</h3>
            <ul className="mt-4 space-y-2">
              <li><Link href="#" className="text-xs text-muted-foreground hover:text-foreground">Catalogue 2025-26</Link></li>
              <li><Link href="/courses" className="text-xs text-muted-foreground hover:text-foreground">700+ Formations internationales</Link></li>
              <li><Link href="#" className="text-xs text-muted-foreground hover:text-foreground">Formations en ligne</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-semibold tracking-wider uppercase">Campus</h3>
            <ul className="mt-4 space-y-2">
              {campuses && campuses.length > 0 ? (
                 campuses.map(campus => (
                  <li key={campus.id}><Link href={`/campus/${campus.slug}`} className="text-xs text-muted-foreground hover:text-foreground">{campus.name}</Link></li>
                 ))
              ) : (
                <>
                  <li><Link href="#" className="text-xs text-muted-foreground hover:text-foreground">Dubaï</Link></li>
                  <li><Link href="#" className="text-xs text-muted-foreground hover:text-foreground">Côte d’Azur</Link></li>
                  <li><Link href="#" className="text-xs text-muted-foreground hover:text-foreground">Paris</Link></li>
                </>
              )}
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-semibold tracking-wider uppercase">Autre</h3>
            <ul className="mt-4 space-y-2">
              <li><Link href="#" className="text-xs text-muted-foreground hover:text-foreground">Services</Link></li>
              <li><Link href="/publications" className="text-xs text-muted-foreground hover:text-foreground">Publications</Link></li>
              <li><Link href="#" className="text-xs text-muted-foreground hover:text-foreground">Partenariats d'entreprise</Link></li>
              <li><Link href="#" className="text-xs text-muted-foreground hover:text-foreground">Actualités et Mises à jour</Link></li>
            </ul>
          </div>
          <div className="flex flex-col gap-4 items-start lg:items-end">
            <Link href="/" className="flex items-center gap-2 h-6">
                {companyProfile?.logoUrl ? (
                  <Image
                    src={companyProfile.logoUrl}
                    alt={companyProfile.name || 'Company Logo'}
                    width={100}
                    height={24}
                    className="h-6 w-auto object-contain"
                  />
                ) : null}
            </Link>
            <p className="text-xs text-muted-foreground text-left lg:text-right">
              Institut de Management, Économie et Développement Appliqué.
            </p>
             <div className="flex items-center gap-4">
              <Link href="#" aria-label="Instagram">
                <Instagram className="h-5 w-5 text-muted-foreground transition-colors hover:text-primary" />
              </Link>
              <Link href="#" aria-label="YouTube">
                <Youtube className="h-5 w-5 text-muted-foreground transition-colors hover:text-primary" />
              </Link>
            </div>
          </div>
        </div>
        
        <div className="mt-8 border-t pt-6 flex flex-wrap justify-center gap-x-6 gap-y-2">
           <Link href="#" className="text-xs text-muted-foreground transition-colors hover:text-primary">Conditions d’utilisation</Link>
           <Link href="#" className="text-xs text-muted-foreground transition-colors hover:text-primary">Politique de confidentialité</Link>
           <Link href="#" className="text-xs text-muted-foreground transition-colors hover:text-primary">Protection de nos marques</Link>
           <Link href="/login" className="text-xs text-muted-foreground transition-colors hover:text-primary">Login éditeur</Link>
        </div>

        <div className="mt-8 border-t pt-6 text-center">
            <p className="text-xs text-muted-foreground">
              © 2025 {companyProfile?.name ? companyProfile.name : 'Imeda International – IMEDA'}.
            </p>
             <p className="text-xs text-muted-foreground mt-1">
              L’institution Licences 4700-9288 (Dubaï) et 1671-3512 (Europe).
            </p>
        </div>
      </div>
    </footer>
  );
}