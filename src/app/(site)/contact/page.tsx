
'use client';

import { ContactForm } from "@/components/contact-form";
import { useRouter } from "next/navigation";

export default function ContactPage() {
  const router = useRouter();

  return (
    <div className="container mx-auto max-w-2xl px-4 py-12 md:px-6">
      <ContactForm onFormSubmit={() => router.push('/')} showHeader={true} />
    </div>
  );
}
