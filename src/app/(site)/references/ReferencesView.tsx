
// src/app/(site)/references/ReferencesView.tsx
'use client';

import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";

interface Section {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
}

interface Page {
  id: string;
  title: string;
  sections: Section[];
}

interface Reference {
    id: string;
    name: string;
    logoUrl: string;
}

interface ReferencesViewProps {
  pageData: Page | null;
  references: Reference[];
}

export default function ReferencesView({ pageData, references }: ReferencesViewProps) {
  const heroSection = pageData?.sections.find(s => s.id === 'hero');
  const heroImageUrl = heroSection?.imageUrl;

  return (
    <div className="flex flex-col">
      <section className="container py-8">
        <div className="relative h-[40vh] min-h-[300px] w-full overflow-hidden">
            {!pageData ? (
              <Skeleton className="h-full w-full" />
            ) : (
              heroImageUrl && (
                <Image
                    src={heroImageUrl}
                    alt={heroSection?.title || "Nos Références background"}
                    fill
                    className="object-cover"
                    priority
                />
              )
            )}
            <div className="absolute inset-0 bg-black/50" />
            <div className="relative z-10 flex h-full flex-col items-center justify-center text-center text-white p-4">
                {!pageData ? (
                <div className="w-full max-w-3xl space-y-4">
                    <Skeleton className="h-12 w-3/4 mx-auto bg-gray-400/50" />
                    <Skeleton className="h-6 w-full max-w-2xl mx-auto bg-gray-400/50" />
                </div>
                ) : (
                <>
                    <h1 className="text-2xl font-normal tracking-tighter sm:text-3xl md:text-4xl font-headline text-white">
                    {heroSection?.title || "Nos Références"}
                    </h1>
                    <p className="mx-auto mt-4 max-w-[600px] text-sm text-gray-200 md:text-base">
                    {heroSection?.content || "Ils nous font confiance pour leurs projets de formation et de développement."}
                    </p>
                </>
                )}
            </div>
        </div>
      </section>

      <section className="container py-12 md:py-16 lg:py-20">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
            {references.map((ref) => (
                <div key={ref.id} className="flex justify-center items-center p-4 border rounded-lg bg-card h-32">
                    <Image 
                        src={ref.logoUrl}
                        alt={ref.name}
                        width={150}
                        height={60}
                        className="object-contain max-h-16 w-auto"
                    />
                </div>
            ))}
        </div>
      </section>
    </div>
  );
}
