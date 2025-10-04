import { Suspense } from 'react';
import CoursesView from './CoursesView'; // This imports the component you just created
import { Skeleton } from '@/components/ui/skeleton';

// This is a simple loading placeholder that will show while your data loads.
const CoursesPageSkeleton = () => {
    return (
        <div className="container mx-auto px-4 py-12 md:px-6">
            <Skeleton className="mb-8 h-[250px] w-full" />
            <div className="space-y-4">
                <Skeleton className="h-10 w-1/2" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="mt-6 h-48 w-full" />
            </div>
        </div>
    );
};

// This is your new page component. It's much simpler now.
export default function CoursesPage() {
  return (
    <Suspense fallback={<CoursesPageSkeleton />}>
      <CoursesView />
    </Suspense>
  );
}