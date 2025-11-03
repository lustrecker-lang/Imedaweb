
// src/app/layout.tsx
import { Metadata } from "next";
import Script from "next/script";
import { adminDb } from "@/firebase/admin";
import { cache } from "react";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import { FirebaseClientProvider } from "@/firebase";

interface CompanyProfile {
  name?: string;
  faviconUrl?: string;
  websiteDescription?: string;
}

// Memoized data fetching for the company profile
const getCompanyProfile = cache(async () => {
  try {
    const snap = await adminDb.collection('companyProfile').doc('main').get();
    return snap.exists ? snap.data() as CompanyProfile : null;
  } catch (error) {
    console.error("Error fetching company profile for global metadata:", error);
    return null;
  }
});

// Global metadata generation
export async function generateMetadata(): Promise<Metadata> {
  const companyProfile = await getCompanyProfile();
  const siteName = companyProfile?.name || 'IMEDA';
  const description = companyProfile?.websiteDescription || `Formation et conseil pour les leaders de demain.`;
  
  const faviconUrl = '/favicon.ico'; // Always use the local favicon.ico

  return {
    title: {
      template: '%s | ' + siteName,
      default: siteName,
    },
    description: description,
    manifest: "/manifest.json",
    icons: {
      icon: faviconUrl,
    },
  };
}

// Root layout is a Server Component that wraps the entire app
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-body antialiased"
        )}
      >
        <FirebaseClientProvider>
          {children}
          <Toaster />
        </FirebaseClientProvider>
        <Script
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtag/js?id=G-0HZRN72X6H"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-0HZRN72X6H');
          `}
        </Script>
      </body>
    </html>
  );
}
