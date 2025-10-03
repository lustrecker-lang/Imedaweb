'use client';

import { Button } from '@/components/ui/button';
import { useFirestore, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const pagesToSeed = [
    {
        id: "home",
        title: "Home Page",
        sections: [
            {
                id: "hero",
                title: "Innovate. Manage. Excel.",
                content: "IMEDA provides the tools you need to elevate your business operations to the next level."
            },
            {
                id: "features",
                title: "Features Designed for Growth",
                content: "Our platform is packed with powerful features to help you succeed."
            },
            {
                id: "feature-1",
                title: "Streamlined Workflow",
                content: "Experience unparalleled efficiency with our intuitive and powerful platform, designed to simplify complex tasks."
            },
            {
                id: "feature-2",
                title: "Insightful Analytics",
                content: "Gain a competitive edge with real-time data and comprehensive analytics that drive informed decision-making."
            },
            {
                id: "feature-3",
                title: "Collaborative Environment",
                content: "Foster teamwork and innovation with collaborative tools that connect your team, wherever they are."
            }
        ]
    },
    {
        id: "about",
        title: "About Page",
        sections: [
            {
                id: "hero",
                title: "About Our Company",
                content: "We are a team of passionate individuals dedicated to creating the best solutions for our customers."
            }
        ]
    }
];

export default function SeedPage() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleSeed = () => {
    if (!firestore) return;

    const seedPromises = pagesToSeed.map(page => {
        const pageRef = doc(firestore, 'pages', page.id);
        return setDocumentNonBlocking(pageRef, page, {});
    });

    toast({
        title: "Seeding Initiated",
        description: "Your database is being populated with initial page content.",
    });

    // We are not awaiting the promises here, as the updates are non-blocking.
    // The user will be notified that the process has started.
  };

  return (
    <div className="container mx-auto px-4 py-12 md:px-6">
       <Card>
        <CardHeader>
          <CardTitle>Database Seeding</CardTitle>
          <CardDescription>
            Click the button below to populate your Firestore database with the initial content for your website pages (Home and About). 
            This is a one-time action.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleSeed}>Seed Database</Button>
        </CardContent>
      </Card>
    </div>
  );
}
