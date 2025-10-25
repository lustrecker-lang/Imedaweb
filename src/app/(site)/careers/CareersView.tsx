
'use client';

import Image from "next/image";
import { useState, useMemo, useEffect } from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useFirestore, addDocumentNonBlocking, useStorage } from "@/firebase";
import { collection, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Loader2, Info } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

// Section & Page Interfaces
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

// Job Opening Interfaces & Schemas
const jobOpeningSchema = z.object({
  positionName: z.string(),
  type: z.string(),
  workMode: z.string(),
  description: z.string(),
  fullDescription: z.string().optional(),
});
interface JobOpening extends z.infer<typeof jobOpeningSchema> {
  id: string;
}

// Application Form Schema
const applicationFormSchema = z.object({
  fullName: z.string().min(1, { message: "Le nom est requis." }),
  email: z.string().email({ message: "Un email valide est requis." }),
  phone: z.string().optional(),
  cv: z.any().refine(file => file instanceof File, "Un CV est requis."),
});

interface CareersViewProps {
  pageData: Page | null;
  jobOpenings: JobOpening[];
}

// Application Form Component
function ApplicationForm({ positionName, onFormSubmit, inDialog = false }: { positionName: string, onFormSubmit: () => void, inDialog?: boolean }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof applicationFormSchema>>({
    resolver: zodResolver(applicationFormSchema),
    defaultValues: { fullName: "", email: "", phone: "" },
  });

  async function onSubmit(values: z.infer<typeof applicationFormSchema>) {
    setIsSubmitting(true);
    if (!firestore || !storage) {
      toast({ variant: "destructive", title: "Erreur", description: "Le service de base de données n'est pas disponible." });
      setIsSubmitting(false);
      return;
    }

    try {
      const file = values.cv as File;
      const fileExtension = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExtension}`;
      const storageRef = ref(storage, `cv-submissions/${fileName}`);
      const snapshot = await uploadBytes(storageRef, file);
      const cvUrl = await getDownloadURL(snapshot.ref);

      await addDocumentNonBlocking(collection(firestore, 'leads'), {
        fullName: values.fullName,
        email: values.email,
        phone: values.phone,
        leadType: 'Job Application',
        positionAppliedFor: positionName,
        cvUrl: cvUrl,
        message: `Application for ${positionName}`,
        createdAt: serverTimestamp(),
      });

      onFormSubmit();
      form.reset();
      if (!inDialog) {
        // Only show toast for non-dialog form
        toast({ title: "Candidature envoyée!", description: "Merci. Nous examinerons votre candidature." });
      }

    } catch (error) {
      console.error("Erreur lors de l'envoi de la candidature:", error);
      toast({ variant: "destructive", title: "Erreur", description: "Impossible d'envoyer votre candidature." });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="fullName" render={({ field }) => (
          <FormItem><FormLabel>Nom et Prénom</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="email" render={({ field }) => (
          <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="phone" render={({ field }) => (
          <FormItem><FormLabel>Téléphone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="cv" render={({ field: { onChange, value, ...rest } }) => (
          <FormItem>
            <FormLabel>CV (PDF, DOCX)</FormLabel>
            <FormControl>
              <Input type="file" accept=".pdf,.doc,.docx" onChange={(e) => onChange(e.target.files?.[0])} {...rest} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        {inDialog ? (
             <DialogFooter>
                <DialogClose asChild><Button type="button" variant="ghost">Annuler</Button></DialogClose>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Envoi...</> : 'Postuler'}
                </Button>
            </DialogFooter>
        ) : (
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Envoi...</> : 'Postuler'}
            </Button>
        )}
      </form>
    </Form>
  );
}

export default function CareersView({ pageData, jobOpenings }: CareersViewProps) {
  const heroSection = pageData?.sections.find(s => s.id === 'hero');
  const heroImageUrl = heroSection?.imageUrl;
  
  const valueSections = useMemo(() => {
    return pageData?.sections.filter(s => s.id.startsWith('value-')) || [];
  }, [pageData]);

  const [selectedJob, setSelectedJob] = useState<JobOpening | null>(null);
  const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkIsMobile = () => setIsMobile(window.innerWidth < 768);
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  const handleApplyClick = (job: JobOpening) => {
    setSelectedJob(job);
    setFormSubmitted(false);
    setIsApplyDialogOpen(true);
  };
  
  const handleDetailClick = (job: JobOpening) => {
    setSelectedJob(job);
    setIsDetailDialogOpen(true);
  };

  const handleFormSubmit = () => {
    setFormSubmitted(true);
  };

  useEffect(() => {
    // This allows the success message to be shown before the dialog closes.
    if (formSubmitted && !isApplyDialogOpen) {
      setTimeout(() => {
        setFormSubmitted(false);
      }, 500);
    }
  }, [formSubmitted, isApplyDialogOpen]);

  return (
    <div className="flex flex-col">
      <section className="container py-8">
        <div className="relative h-[40vh] min-h-[300px] w-full overflow-hidden rounded-lg">
            {!pageData ? (
              <Skeleton className="h-full w-full" />
            ) : (
              heroImageUrl && (
                <Image
                    src={heroImageUrl}
                    alt={heroSection?.title || "Carrières background"}
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
                    {heroSection?.title || "Carrières"}
                    </h1>
                    <p className="mx-auto mt-4 max-w-[600px] text-sm text-gray-200 md:text-base">
                    {heroSection?.content || "Rejoignez notre équipe et construisons l'avenir ensemble."}
                    </p>
                </>
                )}
            </div>
        </div>
      </section>

      {/* Values Section */}
      {valueSections.length > 0 && (
          <section className="py-16 md:py-24">
              <div className="container px-4 md:px-6">
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                       {valueSections.map(section => (
                           <Card key={section.id} className="flex flex-col overflow-hidden">
                               {section.imageUrl && (
                                   <div className="relative aspect-video w-full">
                                        <Image src={section.imageUrl} alt={section.title} fill className="object-cover" />
                                   </div>
                               )}
                               <CardHeader>
                                   <CardTitle className="font-headline text-2xl font-normal">{section.title}</CardTitle>
                               </CardHeader>
                               <CardContent className="flex-grow">
                                   <p className="text-sm text-muted-foreground">{section.content}</p>
                               </CardContent>
                           </Card>
                       ))}
                   </div>
              </div>
          </section>
      )}

      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container px-4 md:px-6">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            <div className="space-y-4">
              <h2 className="text-3xl font-normal tracking-tighter sm:text-4xl font-headline">Devenez Formateur Agréé</h2>
              <p className="text-muted-foreground">
                Nous sommes constamment à la recherche de professionnels passionnés et expérimentés pour rejoindre notre corps enseignant. Si vous êtes un expert dans votre domaine et que vous souhaitez transmettre votre savoir, nous voulons vous connaître.
              </p>
              <ul className="space-y-3 mt-4">
                <li className="flex items-start"><CheckCircle className="h-5 w-5 mr-3 mt-0.5 text-primary shrink-0" /><span>Postes ouverts à Paris, Côte d’Azur, Dubaï et en télétravail.</span></li>
                <li className="flex items-start"><CheckCircle className="h-5 w-5 mr-3 mt-0.5 text-primary shrink-0" /><span>Maîtrise du français indispensable.</span></li>
                <li className="flex items-start"><CheckCircle className="h-5 w-5 mr-3 mt-0.5 text-primary shrink-0" /><span>Paiements rapides et fiables garantis.</span></li>
              </ul>
            </div>
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="font-headline font-normal">Postulez Spontanément</CardTitle>
                <CardDescription>Envoyez-nous vos informations et votre CV. Nous vous contacterons.</CardDescription>
              </CardHeader>
              <CardContent>
                <ApplicationForm positionName="Spontaneous Trainer Application" onFormSubmit={() => {}} />
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      
      <section className="py-16 md:py-24">
        <div className="container px-4 md:px-6">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl font-normal tracking-tighter sm:text-4xl font-headline">Nos Offres d'Emploi</h2>
            <p className="mt-4 text-muted-foreground">
                Découvrez les opportunités pour rejoindre nos équipes administratives, marketing, et techniques.
            </p>
          </div>
          {isMobile ? (
            <div className="space-y-4">
              {jobOpenings && jobOpenings.length > 0 ? (
                jobOpenings.map((job) => (
                  <Card key={job.id}>
                    <CardHeader>
                      <CardTitle className="font-headline text-xl font-normal">{job.positionName}</CardTitle>
                      <div className="flex gap-2 pt-1">
                        <Badge variant="outline">{job.type}</Badge>
                        <Badge variant="secondary">{job.workMode}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">{job.description}</p>
                      <div className="flex gap-2">
                        {job.fullDescription && (
                          <Button variant="outline" size="sm" onClick={() => handleDetailClick(job)}>
                            <Info className="h-4 w-4 mr-2" /> Détails
                          </Button>
                        )}
                        <Button size="sm" onClick={() => handleApplyClick(job)}>Postuler</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-10">
                  <p className="text-muted-foreground">Aucune offre d'emploi pour le moment.</p>
                </div>
              )}
            </div>
          ) : (
             <Card>
                <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Poste</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Mode</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {jobOpenings && jobOpenings.length > 0 ? (
                        jobOpenings.map((job) => (
                            <TableRow key={job.id}>
                            <TableCell className="font-medium">{job.positionName}</TableCell>
                            <TableCell><Badge variant="outline">{job.type}</Badge></TableCell>
                            <TableCell><Badge variant="secondary">{job.workMode}</Badge></TableCell>
                            <TableCell className="text-sm text-muted-foreground max-w-sm truncate">{job.description}</TableCell>
                            <TableCell className="text-right space-x-2">
                            {job.fullDescription && (
                                <Button variant="ghost" size="sm" onClick={() => handleDetailClick(job)}>
                                    <Info className="h-4 w-4 mr-2" /> Détails
                                </Button>
                            )}
                            <Button size="sm" onClick={() => handleApplyClick(job)}>Postuler</Button>
                            </TableCell>
                            </TableRow>
                        ))
                        ) : (
                        <TableRow><TableCell colSpan={5} className="h-24 text-center">Aucune offre d'emploi pour le moment.</TableCell></TableRow>
                        )}
                    </TableBody>
                    </Table>
                </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Dialog for Job Details */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="sm:max-w-lg">
            <DialogHeader>
                <DialogTitle>{selectedJob?.positionName}</DialogTitle>
                <DialogDescription>Type: {selectedJob?.type} | Mode: {selectedJob?.workMode}</DialogDescription>
            </DialogHeader>
            <div className="py-4 whitespace-pre-wrap text-sm text-muted-foreground">{selectedJob?.fullDescription}</div>
             <DialogFooter>
                <DialogClose asChild><Button variant="outline">Fermer</Button></DialogClose>
                <Button onClick={() => { setIsDetailDialogOpen(false); if(selectedJob) handleApplyClick(selectedJob); }}>Postuler</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog for Applying */}
      <Dialog open={isApplyDialogOpen} onOpenChange={setIsApplyDialogOpen}>
        <DialogContent className="sm:max-w-md">
            {formSubmitted ? (
                 <div className="flex flex-col items-center justify-center text-center space-y-4 py-8">
                    <CheckCircle className="h-16 w-16 text-green-500" />
                    <h3 className="text-xl font-headline font-normal">Candidature Envoyée!</h3>
                    <p className="text-xs text-muted-foreground max-w-xs">
                        Merci. Nous avons bien reçu votre candidature pour le poste de {selectedJob?.positionName} et nous reviendrons vers vous.
                    </p>
                    <Button onClick={() => setIsApplyDialogOpen(false)} className="w-full">Fermer</Button>
                </div>
            ) : (
                 <>
                    <DialogHeader>
                        <DialogTitle>Postuler pour {selectedJob?.positionName}</DialogTitle>
                        <DialogDescription>Veuillez remplir le formulaire ci-dessous.</DialogDescription>
                    </DialogHeader>
                    <ApplicationForm positionName={selectedJob?.positionName || ''} onFormSubmit={handleFormSubmit} inDialog={true} />
                 </>
            )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
