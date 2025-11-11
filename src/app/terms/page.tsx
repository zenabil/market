

import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const TermsPageClient = dynamic(() => import('./terms-client'), {
    loading: () => <TermsPageSkeleton />,
});


export const metadata: Metadata = {
    title: 'Conditions d\'utilisation',
    description: 'Lisez les conditions d\'utilisation pour l\'utilisation du site Tlemcen Smart Supermarket.',
     robots: {
        index: true,
        follow: true,
    },
};

export default function TermsPage() {
  return (
    <Suspense fallback={<TermsPageSkeleton />}>
        <TermsPageClient />
    </Suspense>
  );
}


function TermsPageSkeleton() {
    return (
        <div className="container py-8 md:py-12">
            <div className="prose dark:prose-invert mx-auto max-w-3xl">
                <Skeleton className="h-10 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-2 mb-8" />
                <div className="space-y-4">
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-6 w-1/3 mt-6" />
                    <Skeleton className="h-4 w-full" />
                </div>
            </div>
        </div>
    );
}
    
