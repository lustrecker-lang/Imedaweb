
'use client';

import { ContactForm } from "@/components/contact-form";
import { useRouter } from "next/navigation";

export default function ContactPage() {
  const router = useRouter();

  return (
    <div className="container mx-auto max-w-2xl px-4 py-12 md:px-6">
       <div className="mb-8 text-center">
        <h1 className="text-2xl font-normal tracking-tighter sm:text-3xl font-headline">Contactez-nous</h1>
        <p className="text-muted-foreground mt-2">
            Remplissez le formulaire ci-dessous et nous vous répondrons dans les plus brefs délais.
        </p>
      </div>
      <ContactForm onFormSubmit={() => router.push('/')} showHeader={false} />
    </div>
  );
}
