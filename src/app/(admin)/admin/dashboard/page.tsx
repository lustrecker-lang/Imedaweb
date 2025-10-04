
'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';

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

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();

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

  if (isUserLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 md:px-6">
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
                 Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-5 w-1/4" />
                      </TableCell>
                    </TableRow>
                  ))
              ) : pages && pages.length > 0 ? (
                pages.map((page) => (
                  <TableRow
                    key={page.id}
                    onClick={() => handleRowClick(page.id)}
                    className="cursor-pointer"
                  >
                    <TableCell className="font-medium">{page.title}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell>No pages found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
