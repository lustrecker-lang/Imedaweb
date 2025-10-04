'use client';

import Image from "next/image";
import { doc } from 'firebase/firestore';

import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
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

export default function AboutPage() {
  const firestore = useFirestore();
  const pageRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'pages', 'about');
  }, [firestore]);
  
  const { data: aboutPage, isLoading } = useDoc<Page>(pageRef);

  const heroSection = aboutPage?.sections.find(s => s.id === 'hero');
  const heroImageUrl = heroSection?.imageUrl;

  return (
    <div className="flex flex-col">
      <section className="container py-8">
        <div className="relative h-[40vh] min-h-[300px] w-full overflow-hidden">
            {isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              heroImageUrl && (
                <Image
                    src={heroImageUrl}
                    alt={heroSection?.title || "About us background"}
                    fill
                    className="object-cover"
                    priority
                />
              )
            )}
            <div className="absolute inset-0 bg-black/50" />
            <div className="relative z-10 flex h-full flex-col items-center justify-center text-center text-white p-4">
                {isLoading ? (
                <div className="w-full max-w-3xl space-y-4">
                    <Skeleton className="h-12 w-3/4 mx-auto bg-gray-400/50" />
                    <Skeleton className="h-6 w-full max-w-2xl mx-auto bg-gray-400/50" />
                </div>
                ) : (
                <>
                    <h1 className="text-2xl font-normal tracking-tighter sm:text-3xl md:text-4xl font-headline text-white">
                    {heroSection?.title || "About Us"}
                    </h1>
                    <p className="mx-auto mt-4 max-w-[600px] text-sm text-gray-200 md:text-base">
                    {heroSection?.content || "Learn more about our company, our mission, and our team."}
                    </p>
                </>
                )}
            </div>
        </div>
      </section>
    </div>
  );
}
