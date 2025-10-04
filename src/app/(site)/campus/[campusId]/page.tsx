
'use client';

import Image from "next/image";
import { collection, query, where, getDocs, DocumentData } from 'firebase/firestore';
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { useFirestore, useMemoFirebase } from "@/firebase";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Campus {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
}

export default function CampusPage() {
  const firestore = useFirestore();
  const params = useParams();
  const slug = params.slug as string;

  const [campus, setCampus] = useState<Campus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const campusQuery = useMemoFirebase(() => {
    if (!firestore || !slug) return null;
    // Note: This query requires a Firestore index on the 'slug' field.
    return query(collection(firestore, 'campuses'), where('slug', '==', slug));
  }, [firestore, slug]);

  useEffect(() => {
    if (!campusQuery) {
      setIsLoading(false);
      return;
    };

    const fetchCampus = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const querySnapshot = await getDocs(campusQuery);
        if (querySnapshot.empty) {
          setError("No campus found for this URL.");
          setCampus(null);
        } else {
          // Assuming slugs are unique, take the first result.
          const doc = querySnapshot.docs[0];
          setCampus({ id: doc.id, ...(doc.data() as Omit<Campus, 'id'>) });
        }
      } catch (e) {
        console.error("Error fetching campus:", e);
        setError("Failed to load campus data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCampus();
  }, [campusQuery]);

  return (
    <div className="flex flex-col">
      <section className="container py-8">
        <div className="relative h-[40vh] min-h-[300px] w-full overflow-hidden">
            {isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              campus?.imageUrl && (
                <Image
                    src={campus.imageUrl}
                    alt={campus.name || "Campus background"}
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
                </div>
                ) : (
                <h1 className="text-2xl font-normal tracking-tighter sm:text-3xl md:text-4xl font-headline text-white">
                    Campus: {campus?.name || "Campus Details"}
                </h1>
                )}
            </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container px-4 md:px-6">
          <Card>
            <CardHeader>
              <CardTitle>About {campus?.name}</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              ) : error ? (
                <p className="text-destructive">{error}</p>
              ) : (
                <p className="text-muted-foreground">{campus?.description || "More details about this campus will be available soon."}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
