
'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useCollection, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface Section {
  id: string;
  title: string;
  content: string;
}

interface Page {
  id: string;
  title: string;
  sections: Section[];
}

const courseDetailsSeed = {
  valeurImeda: {
    title: "Un Réseau International d'Excellence",
    content: "En rejoignant IMEDA, vous accédez à un écosystème dynamique d'acteurs influents, d'experts sectoriels et de décideurs africains et européens. Nos programmes sont conçus pour favoriser les connexions, le partage d'expériences et la création d'opportunités professionnelles durables.",
    imageUrl: "https://picsum.photos/seed/imeda-value/800/600",
  },
  faq: [
    { id: 'faq-1', question: 'When should I apply?', answer: 'We recommend applying at least three months in advance to secure your spot, as our programs often fill up quickly.' },
    { id: 'faq-2', question: 'How do I reserve a space?', answer: 'You can reserve your space by filling out the inquiry form on this page. Our advisors will then guide you through the enrollment process.' },
    { id: 'faq-3', question: 'Do you make a custom course for me?', answer: 'Yes, we offer customized corporate training solutions. Please contact us to discuss your specific needs.' },
    { id: 'faq-4', question: 'How does the full process work?', answer: 'The process is simple: 1. Inquire about the course. 2. Our advisor contacts you. 3. Finalize your enrollment and payment. 4. Receive your pre-course materials and get ready to learn!' }
  ],
  contact: {
    name: "Amel K.",
    title: "Représentante de la formation",
    description: "Que vous soyez un particulier ou une organisation/un groupe à la recherche d'un programme, contactez-nous et nous vous aiderons à trouver la meilleure solution pour vous.",
    francePhone: "+33 1 89 16 93 08",
    uaePhone: "+971 4 565 61 57",
    email: "amel@imeda.fr",
    imageUrl: "https://picsum.photos/seed/rep/400/400"
  }
};


export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();

  const pagesRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'pages'), orderBy('title', 'asc'));
  }, [firestore]);

  const { data: pages, isLoading: arePagesLoading } = useCollection<Page>(pagesRef);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const handleRowClick = (pageId: string) => {
    router.push(`/admin/editor/${pageId}`);
  };

  const handleSeedCourseDetails = () => {
    if (!firestore) return;
    const docRef = doc(firestore, 'courseDetailPage', 'main');
    setDocumentNonBlocking(docRef, courseDetailsSeed, {});
    toast({
        title: "Seeding Initiated",
        description: "Course details page content is being populated.",
    });
  }

  if (isUserLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 md:px-6">
       <div className="fixed bottom-4 right-4 z-50">
        <Button onClick={handleSeedCourseDetails}>Seed Course Details Page</Button>
      </div>
      <header className="mb-8">
        <h1 className="text-xl font-bold tracking-tight">Content Dashboard</h1>
        <p className="text-sm text-muted-foreground">Select a page to manage its content.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Website Pages</CardTitle>
          <CardDescription>Click on a page to edit its content sections.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Page Title</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {arePagesLoading ? (
                 Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-5 w-1/4" />
                      </TableCell>
                    </TableRow>
                  ))
              ) : (
                <>
                  {pages && pages.map((page) => (
                    <TableRow
                      key={page.id}
                      onClick={() => handleRowClick(page.id)}
                      className="cursor-pointer"
                    >
                      <TableCell className="font-medium">{page.title}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow
                    onClick={() => router.push('/admin/editor/course-details')}
                    className="cursor-pointer"
                  >
                    <TableCell className="font-medium">Course Details</TableCell>
                  </TableRow>
                </>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
