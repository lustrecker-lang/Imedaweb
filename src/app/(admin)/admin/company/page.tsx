'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, setDocumentNonBlocking, useStorage } from '@/firebase';
import { doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { v4 as uuidv4 } from 'uuid';

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
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';

const formSchema = z.object({
  name: z.string().min(1, 'Company name is required.'),
  logoUrl: z.string().optional(),
  iconUrl: z.string().optional(),
  faviconUrl: z.string().optional(),
});

interface CompanyProfile {
  name: string;
  logoUrl?: string;
  iconUrl?: string;
  faviconUrl?: string;
}

export default function CompanyPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  
  const companyProfileRef = useMemo(() => {
    if (!firestore) return null;
    return doc(firestore, 'companyProfile', 'main');
  }, [firestore]);

  const { data: companyProfile, isLoading: isProfileLoading } = useDoc<CompanyProfile>(companyProfileRef);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      logoUrl: '',
      iconUrl: '',
      faviconUrl: '',
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

  const handleFileUpload = async (file: File | null): Promise<string | null> => {
    if (!file || !storage || !user) return null;

    const fileExtension = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const storageRef = ref(storage, `company-assets/${fileName}`);
    
    try {
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      console.error("File upload error:", error);
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: "Could not upload the file. Please try again.",
      });
      return null;
    }
  };


  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!firestore) return;
    form.clearErrors();

    let logoUrl = values.logoUrl;
    if (logoFile) {
        logoUrl = await handleFileUpload(logoFile);
        if (!logoUrl) return; // Stop submission if upload failed
    }

    let iconUrl = values.iconUrl;
    if (iconFile) {
        iconUrl = await handleFileUpload(iconFile);
        if (!iconUrl) return; // Stop submission if upload failed
    }
    
    let faviconUrl = values.faviconUrl;
    if (faviconFile) {
        faviconUrl = await handleFileUpload(faviconFile);
        if (!faviconUrl) return; // Stop submission if upload failed
    }

    const docRef = doc(firestore, 'companyProfile', 'main');
    
    const dataToSave = {
        name: values.name,
        logoUrl: logoUrl,
        iconUrl: iconUrl,
        faviconUrl: faviconUrl,
    };

    setDocumentNonBlocking(docRef, dataToSave, { merge: true });

    toast({
      title: 'Success!',
      description: 'Company profile has been updated.',
    });
    setLogoFile(null);
    setIconFile(null);
    setFaviconFile(null);
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
            Update your company name, logo, app icon, and favicon.
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
                    name="logoUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Logo</FormLabel>
                         {companyProfile?.logoUrl && (
                          <div className="my-2">
                            <Image src={companyProfile.logoUrl} alt="Current Logo" width={100} height={40} className="object-contain" />
                          </div>
                        )}
                        <FormControl>
                          <Input 
                            type="file" 
                            accept="image/svg+xml, image/png, image/jpeg"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                setLogoFile(e.target.files[0]);
                                field.onChange(e.target.files[0].name); // To satisfy react-hook-form
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name="iconUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>App Icon</FormLabel>
                        {companyProfile?.iconUrl && (
                          <div className="my-2">
                             <Image src={companyProfile.iconUrl} alt="Current App Icon" width={32} height={32} className="object-contain" />
                          </div>
                        )}
                        <FormControl>
                          <Input 
                            type="file" 
                            accept="image/svg+xml, image/png, image/jpeg"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                setIconFile(e.target.files[0]);
                                field.onChange(e.target.files[0].name); // To satisfy react-hook-form
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="faviconUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Favicon</FormLabel>
                        {companyProfile?.faviconUrl && (
                          <div className="my-2">
                             <Image src={companyProfile.faviconUrl} alt="Current Favicon" width={32} height={32} className="object-contain" />
                          </div>
                        )}
                        <FormControl>
                          <Input 
                            type="file" 
                            accept="image/x-icon, image/vnd.microsoft.icon, image/svg+xml, image/png"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                setFaviconFile(e.target.files[0]);
                                field.onChange(e.target.files[0].name); // To satisfy react-hook-form
                              }
                            }}
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
