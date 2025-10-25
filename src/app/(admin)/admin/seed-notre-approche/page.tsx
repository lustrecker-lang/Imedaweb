// src/app/(admin)/admin/seed-notre-approche/page.tsx
'use client';

import { Button } from '@/components/ui/button';
import { useFirestore, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const pageToSeed = {
    id: "notre-approche",
    title: "Notre Approche",
    sections: [
        {
            id: "hero",
            title: "Notre Approche",
            content: "Découvrez la méthodologie unique qui guide notre excellence.",
            imageUrl: "https://picsum.photos/seed/approach-hero/1200/400"
        },
        {
            id: "intro",
            title: "", // No title for this section
            content: "At IMEDA, we believe professional development must create real change — not just deliver knowledge. Every programme we design is built to strengthen leadership capacity, accelerate organisational performance, and spark new ways of thinking that endure well beyond the classroom.",
            imageUrl: null
        },
        {
            id: "grounded",
            title: "An Approach Grounded in Reality",
            content: "We start from the challenges leaders actually face. Our content is anchored in real business cases drawn from African markets and international best practice. Participants leave not only with new concepts, but with the confidence to apply them immediately in their own contexts.",
            imageUrl: "https://picsum.photos/seed/approach-grounded/800/800"
        },
        {
            id: "experience",
            title: "Learning Through Experience",
            content: "Our programmes are interactive, hands-on, and dynamic. Case studies, peer exchange, faculty research, and experiential challenges combine to create meaningful learning journeys that shape both mindset and skillset.",
            imageUrl: "https://picsum.photos/seed/approach-experience/800/800"
        },
        {
            id: "tailored",
            title: "Tailored to Each Organisation",
            content: "We design each programme in close partnership with our clients. Every detail — from structure to faculty selection — aligns with the organisation’s goals and culture. This ensures that learning supports strategy, rather than sitting beside it.",
            imageUrl: "https://picsum.photos/seed/approach-tailored/800/800"
        },
        {
            id: "insight",
            title: "Local Insight, Global Perspective",
            content: "IMEDA operates at the intersection of Africa, Europe, and the Gulf. Our trainers bring deep understanding of regional realities, combined with global standards of excellence. This blend of perspectives helps participants translate global ideas into local impact.",
            imageUrl: "https://picsum.photos/seed/approach-insight/800/800"
        },
        {
            id: "impact",
            title: "Built for Measurable Impact",
            content: "Our goal is transformation that lasts. We measure success not by attendance, but by tangible results: stronger leadership, more effective collaboration, and a culture of continuous learning across the organisation.",
            imageUrl: "https://picsum.photos/seed/approach-impact/800/800"
        }
    ]
};

export default function SeedNotreApprochePage() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleSeed = () => {
    if (!firestore) return;

    const pageRef = doc(firestore, 'pages', pageToSeed.id);
    setDocumentNonBlocking(pageRef, pageToSeed, {});

    toast({
        title: "Seeding Initiated",
        description: "Your database is being populated with content for the 'Notre Approche' page.",
    });
  };

  return (
    <div className="container mx-auto px-4 py-12 md:px-6">
       <Card>
        <CardHeader>
          <CardTitle>Notre Approche Page Seeding</CardTitle>
          <CardDescription>
            Click the button below to populate your Firestore database with the new content sections for the 'Notre Approche' page.
            This will overwrite any existing content for this page.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button onClick={handleSeed}>Seed 'Notre Approche' Page Content</Button>
        </CardContent>
      </Card>
    </div>
  );
}
