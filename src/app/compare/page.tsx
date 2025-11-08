
import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const ComparePageClient = dynamic(() => import('./compare-client'), {
    loading: () => <ComparePageSkeleton />,
    ssr: false,
});

export default function ComparePage() {
    return (
        <Suspense fallback={<ComparePageSkeleton />}>
            <ComparePageClient />
        </Suspense>
    );
}

function ComparePageSkeleton() {
    return (
        <div className="container py-6 md:py-8">
            <div className="flex justify-between items-center mb-8">
                <Skeleton className="h-12 w-1/3" />
                <Skeleton className="h-9 w-24" />
            </div>
            <Skeleton className="h-96 w-full" />
        </div>
    );
}
