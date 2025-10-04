
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';


export default function CoursesPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 md:px-6 space-y-8">
      <header>
        <h1 className="text-xl font-bold tracking-tight">Courses Management</h1>
        <p className="text-sm text-muted-foreground">Manage your academic content hierarchy: Catégories, Thèmes, Formations, and Modules.</p>
      </header>

      <div className="grid gap-8 lg:grid-cols-2">
          {/* Categories Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Catégories</CardTitle>
                    <CardDescription>Manage disciplines</CardDescription>
                </div>
                <Button size="sm"><Plus className="mr-2 h-4 w-4" /> Add Category</Button>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">Category management UI will be here.</p>
            </CardContent>
          </Card>
          
          {/* Themes Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Thèmes</CardTitle>
                    <CardDescription>Manage topics within categories</CardDescription>
                </div>
                <Button size="sm"><Plus className="mr-2 h-4 w-4" /> Add Theme</Button>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">Theme management UI will be here.</p>
            </CardContent>
          </Card>

          {/* Formations Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Formations</CardTitle>
                    <CardDescription>Manage specific courses</CardDescription>
                </div>
                <Button size="sm"><Plus className="mr-2 h-4 w-4" /> Add Formation</Button>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">Formation management UI will be here.</p>
            </CardContent>
          </Card>

          {/* Modules Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Modules</CardTitle>
                    <CardDescription>Manage learning modules</CardDescription>
                </div>
                <Button size="sm"><Plus className="mr-2 h-4 w-4" /> Add Module</Button>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">Module management UI will be here.</p>
            </CardContent>
          </Card>
      </div>

    </div>
  );
}

    