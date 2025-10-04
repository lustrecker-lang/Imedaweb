'use client';

import { Button } from '@/components/ui/button';
import { useFirestore, setDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
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

const campusesToSeed = [
    { name: "Dubaï" },
    { name: "Côte d’Azur" },
    { name: "Paris" },
];

export default function SeedPage() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleSeed = () => {
    if (!firestore) return;

    pagesToSeed.forEach(page => {
        const pageRef = doc(firestore, 'pages', page.id);
        setDocumentNonBlocking(pageRef, page, {});
    });

    const campusCollection = collection(firestore, 'campuses');
    campusesToSeed.forEach(campus => {
        addDocumentNonBlocking(campusCollection, campus);
    });

    toast({
        title: "Seeding Initiated",
        description: "Your database is being populated with initial content.",
    });
  };

  return (
    <div className="container mx-auto px-4 py-12 md:px-6">
       <Card>
        <CardHeader>
          <CardTitle>Database Seeding</CardTitle>
          <CardDescription>
            Click the button below to populate your Firestore database with the initial content for your website pages and campuses. 
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
