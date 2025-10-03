'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function MakeAdminPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const [message, setMessage] = useState('Checking authentication status...');
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    if (isUserLoading) {
      return; // Wait until user status is resolved
    }

    if (!user) {
      setMessage('You must be logged in to become an admin. Please log in and try again.');
      setIsProcessing(false);
      return;
    }

    if (!firestore) {
        setMessage('Firestore is not available. Please try again later.');
        setIsProcessing(false);
        return;
    }

    const grantAdminPrivileges = async () => {
      setMessage(`Granting admin privileges to ${user.email}...`);
      const adminRoleRef = doc(firestore, 'roles_admin', user.uid);
      
      try {
        // We use setDocumentNonBlocking to create the role document.
        // This is a simple existence check, so the data doesn't matter,
        // but we'll add the email for clarity.
        setDocumentNonBlocking(adminRoleRef, { email: user.email }, {});
        
        setMessage('Admin privileges granted successfully! You will be redirected to the dashboard.');
        setTimeout(() => {
          router.push('/admin/dashboard');
        }, 2000);
      } catch (error) {
        console.error('Error granting admin privileges:', error);
        setMessage('An error occurred while granting admin privileges. Check the console for details.');
        setIsProcessing(false);
      }
    };

    grantAdminPrivileges();

  }, [user, isUserLoading, firestore, router]);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Grant Admin Privileges</CardTitle>
          <CardDescription>
            This page will automatically grant administrative rights to the currently logged-in user.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{message}</p>
          {!isProcessing && !user && (
            <Button asChild className="mt-4 w-full">
              <Link href="/login">Go to Login</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
