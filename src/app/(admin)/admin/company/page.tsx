'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

const formSchema = z.object({
  name: z.string().min(1, 'Company name is required.'),
  logoSvg: z.string().optional(),
  iconSvg: z.string().optional(),
});

interface CompanyProfile {
  name: string;
  logoSvg?: string;
  iconSvg?: string;
}

export default function CompanyPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const companyProfileRef = useMemo(() => {
    if (!firestore) return null;
    return doc(firestore, 'companyProfile', 'main');
  }, [firestore]);

  const { data: companyProfile, isLoading: isProfileLoading } = useDoc<CompanyProfile>(companyProfileRef);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      logoSvg: '',
      iconSvg: '',
    },
  });

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
    if (companyProfile) {
      form.reset(companyProfile);
    }
  }, [companyProfile, form]);

  if (isUserLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!firestore) return;
    const docRef = doc(firestore, 'companyProfile', 'main');
    
    setDocumentNonBlocking(docRef, values, { merge: true });

    toast({
      title: 'Success!',
      description: 'Company profile has been updated.',
    });
  };

  return (
    <div className="container mx-auto px-4 py-12 md:px-6">
      <header className="mb-8">
        <h1 className="text-xl font-bold tracking-tight">Company Profile</h1>
        <p className="text-sm text-muted-foreground">Manage your company's branding.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Branding Details</CardTitle>
          <CardDescription>
            Update your company name and logos. The logo will appear in the header, and the icon will be used as a favicon/shortcut icon.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              {isProfileLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : (
                <>
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your Company" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="logoSvg"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Logo (SVG code)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder='<svg>...</svg>'
                            className="min-h-[120px] font-mono"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name="iconSvg"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Icon (SVG code)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder='<svg>...</svg>'
                            className="min-h-[120px] font-mono"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={form.formState.isSubmitting || isProfileLoading}>
                {form.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}