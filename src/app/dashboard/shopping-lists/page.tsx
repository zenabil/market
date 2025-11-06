'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, PlusCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';

export default function ShoppingListsPage() {
    const { user, isUserLoading } = useUser();
    const router = useRouter();

    React.useEffect(() => {
        if (!isUserLoading && !user) {
            router.replace('/login');
        }
    }, [user, isUserLoading, router]);

    if (isUserLoading) {
        return (
            <div className="container py-8 md:py-12 flex-grow flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    
    return (
        <div className="container py-8 md:py-12">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className='font-headline text-3xl'>Mes listes de courses</CardTitle>
                        <CardDescription>Gérez vos listes de courses pour vous organiser.</CardDescription>
                    </div>
                    <Button size="sm" className="gap-1">
                        <PlusCircle className="h-4 w-4" />
                        Créer une liste
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="text-center p-8 text-muted-foreground">
                        <p className="mb-4">À venir: Créez et gérez vos listes de courses ici.</p>
                        <Skeleton className="w-full h-40" />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
