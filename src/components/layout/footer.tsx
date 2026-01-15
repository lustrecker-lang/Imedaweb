

'use client';
import Link from "next/link";
import { Linkedin, Youtube } from "lucide-react";
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
    <footer className="border-t bg-primary text-primary-foreground">
      <div className="container mx-auto max-w-[1400px] px-4 py-8 md:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <h3 className="text-xs font-semibold tracking-wider uppercase">À propos</h3>
            <ul className="mt-4 space-y-2">
              <li><Link href="/presentation" className="text-xs text-primary-foreground/80 hover:text-primary-foreground">Présentation</Link></li>
              <li><Link href="/careers" className="text-xs text-primary-foreground/80 hover:text-primary-foreground">Carrières</Link></li>
              <li><Link href="/notre-approche" className="text-xs text-primary-foreground/80 hover:text-primary-foreground">Notre approche</Link></li>
              <li><Link href="/references" className="text-xs text-primary-foreground/80 hover:text-primary-foreground">Références</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-semibold tracking-wider uppercase">Formations</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link href="/catalog" className="text-xs text-primary-foreground/80 hover:text-primary-foreground">Catalogue 2025-26</Link>
              </li>
              <li><Link href="/courses" className="text-xs text-primary-foreground/80 hover:text-primary-foreground">700+ Formations internationales</Link></li>
              <li><Link href="#" className="text-xs text-primary-foreground/80 hover:text-primary-foreground">Formations en ligne</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-semibold tracking-wider uppercase">Campus</h3>
            <ul className="mt-4 space-y-2">
              {campuses && campuses.length > 0 ? (
                campuses.map(campus => (
                  <li key={campus.id}><Link href={`/campus/${campus.slug}`} className="text-xs text-primary-foreground/80 hover:text-primary-foreground">{campus.name}</Link></li>
                ))
              ) : (
                <>
                  <li><Link href="#" className="text-xs text-primary-foreground/80 hover:text-primary-foreground">Dubaï</Link></li>
                  <li><Link href="#" className="text-xs text-primary-foreground/80 hover:text-primary-foreground">Côte d’Azur</Link></li>
                  <li><Link href="#" className="text-xs text-primary-foreground/80 hover:text-primary-foreground">Paris</Link></li>
                </>
              )}
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-semibold tracking-wider uppercase">Autre</h3>
            <ul className="mt-4 space-y-2">
              <li><Link href="/services" className="text-xs text-primary-foreground/80 hover:text-primary-foreground">Services</Link></li>
              <li><Link href="/publications" className="text-xs text-primary-foreground/80 hover:text-primary-foreground">Publications</Link></li>
              <li><Link href="/partenariats" className="text-xs text-primary-foreground/80 hover:text-primary-foreground">Partenariats d'entreprise</Link></li>
              <li><Link href="/news" className="text-xs text-primary-foreground/80 hover:text-primary-foreground">Actualités</Link></li>
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
            <p className="text-xs text-primary-foreground/60 text-left lg:text-right">
              Institut de Management, Économie et Développement Appliqué.
            </p>
            <div className="flex items-center gap-6">
              <Link href="https://www.linkedin.com/company/institut-imeda/" aria-label="LinkedIn" target="_blank" rel="noopener noreferrer">
                <Linkedin className="h-6 w-6 text-primary-foreground/80 transition-colors hover:text-primary-foreground" />
              </Link>
              <Link href="#" aria-label="YouTube">
                <Youtube className="h-6 w-6 text-primary-foreground/80 transition-colors hover:text-primary-foreground" />
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t pt-6 flex flex-wrap justify-center gap-x-6 gap-y-2">
          <Link href="/legal#terms" className="text-xs text-primary-foreground/80 transition-colors hover:text-primary-foreground">Conditions d’utilisation</Link>
          <Link href="/legal#privacy" className="text-xs text-primary-foreground/80 transition-colors hover:text-primary-foreground">Politique de confidentialité</Link>
          <Link href="/legal#branding" className="text-xs text-primary-foreground/80 transition-colors hover:text-primary-foreground">Protection de nos marques</Link>
          <Link href="/plan-du-site" className="text-xs text-primary-foreground/80 transition-colors hover:text-primary-foreground">Sitemap</Link>
          <Link href="/login" className="text-xs text-primary-foreground/80 transition-colors hover:text-primary-foreground">Login éditeur</Link>
        </div>

        <div className="mt-8 border-t pt-6 text-center">
          <p className="text-xs text-primary-foreground/60">
            © 2025-26 {companyProfile?.name ? companyProfile.name : 'Imeda International – IMEDA'}.
          </p>
          <p className="text-xs text-primary-foreground/60 mt-1">
            L’institution Licences 4700-9288 (Dubaï) et 1671-3512 (Europe).
          </p>
        </div>
      </div>
    </footer>
  );
}
