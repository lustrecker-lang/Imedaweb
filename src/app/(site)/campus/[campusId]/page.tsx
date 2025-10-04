
'use client';

import Image from "next/image";
import { doc } from 'firebase/firestore';
import { useParams } from "next/navigation";

import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Campus {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
}

export default function CampusPage() {
  const firestore = useFirestore();
  const params = useParams();
  const campusId = params.campusId as string;

  const campusRef = useMemoFirebase(() => {
    if (!firestore || !campusId) return null;
    return doc(firestore, 'campuses', campusId);
  }, [firestore, campusId]);
  
  const { data: campus, isLoading } = useDoc<Campus>(campusRef);

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
