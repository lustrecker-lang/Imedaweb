// src/app/(admin)/admin/seed-presentation/page.tsx
'use client';

import { Button } from '@/components/ui/button';
import { useFirestore, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const pageToSeed = {
    id: "presentation",
    title: "Présentation",
    sections: [
        {
            id: "hero",
            title: "Présentation",
            content: "Découvrez qui nous sommes, notre vision et notre engagement envers l'excellence.",
            imageUrl: "https://picsum.photos/seed/presentation-hero/1200/400"
        },
        {
            id: 'mission',
            title: 'Empowering African Leadership for a Global Future',
            content: 'Our mission is to cultivate a new generation of African leaders equipped with the strategic skills and global perspective necessary to drive sustainable development and innovation across the continent. We provide world-class executive education that bridges local realities with international best practices.',
            imageUrl: 'https://picsum.photos/seed/mission/800/600'
        },
        {
            id: 'vision',
            title: 'Our Vision',
            content: 'We envision a future where African organizations, both public and private, are spearheaded by visionary leaders who can navigate complexity, foster inclusive growth, and position the continent as a hub of global innovation and excellence.',
            imageUrl: 'https://picsum.photos/seed/vision/800/600'
        },
        {
            id: 'story',
            title: 'Our Story',
            content: 'Founded by a consortium of leading academics and industry veterans, IMEDA was born from a shared belief in the transformative power of leadership. We recognized a critical need for high-level, context-aware management training that could address the unique challenges and opportunities of the African continent. Since our inception, we have been committed to building a world-class institution that not only educates but also inspires.',
            imageUrl: 'https://picsum.photos/seed/story/800/600'
        },
        {
            id: 'participants',
            title: 'Our Participants and Partners',
            content: 'We are proud to collaborate with a diverse range of participants, from senior government officials and C-suite executives to promising entrepreneurs and managers. Our partners include prestigious international universities, multinational corporations, and development organizations, all united by a common goal: to invest in Africa’s human capital.',
            imageUrl: 'https://picsum.photos/seed/participants/800/600'
        },
        {
            id: 'impact',
            title: 'A Lasting Impact',
            content: 'Our impact is measured by the success of our alumni and the transformative projects they lead. From modernizing public services to scaling innovative businesses, IMEDA graduates are at the forefront of change. We are dedicated to creating a lasting legacy of leadership that will ripple across communities, industries, and nations for generations to come.',
            imageUrl: 'https://picsum.photos/seed/impact/800/600'
        }
    ]
};

export default function SeedPresentationPage() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleSeed = () => {
    if (!firestore) return;

    const pageRef = doc(firestore, 'pages', pageToSeed.id);
    setDocumentNonBlocking(pageRef, pageToSeed, {});

    toast({
        title: "Seeding Initiated",
        description: "Your database is being populated with initial content for the 'Présentation' page.",
    });
  };

  return (
    <div className="container mx-auto px-4 py-12 md:px-6">
       <Card>
        <CardHeader>
          <CardTitle>Présentation Page Seeding</CardTitle>
          <CardDescription>
            Click the button below to populate your Firestore database with the new content sections for the 'Présentation' page.
            If content already exists for 'pages/presentation', it will be overwritten.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button onClick={handleSeed}>Seed 'Présentation' Page Content</Button>
        </CardContent>
      </Card>
    </div>
  );
}
