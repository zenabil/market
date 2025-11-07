
'use client';

import React from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, Leaf, Truck, type LucideProps } from 'lucide-react';
import { useLanguage } from '@/contexts/language-provider';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Nos Atouts',
    description: 'Découvrez pourquoi Tlemcen Smart Supermarket est votre meilleur choix pour faire vos courses : fraîcheur, rapidité et qualité supérieure.',
};


type StoreFeature = {
    id: string;
    title_fr: string;
    description_fr: string;
    title_ar: string;
    description_ar: string;
    icon: string;
};

// Map icon names to actual components
const iconMap: { [key: string]: React.FC<LucideProps> } = {
    Leaf: Leaf,
    Truck: Truck,
    Award: Award,
};


export default function FeaturesPage() {
    const { t, locale } = useLanguage();
    const firestore = useFirestore();

    const featuresQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'storeFeatures'));
    }, [firestore]);

    const { data: features, isLoading } = useCollection<StoreFeature>(featuresQuery);
    
    return (
        <div className="container py-8 md:py-12" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
            <div className="text-center mb-12">
                <h1 className="font-headline text-4xl md:text-5xl lg:text-6xl">{t('features.title')}</h1>
                <p className="mt-4 max-w-3xl mx-auto text-lg text-muted-foreground">{t('features.subtitle')}</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {isLoading && Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i}>
                        <CardHeader>
                            <Skeleton className="h-12 w-12 rounded-full mx-auto" />
                        </CardHeader>
                        <CardContent className="text-center">
                            <Skeleton className="h-6 w-3/4 mx-auto mb-2" />
                            <Skeleton className="h-4 w-full mx-auto" />
                            <Skeleton className="h-4 w-5/6 mx-auto mt-1" />
                        </CardContent>
                    </Card>
                ))}

                {!isLoading && features?.map((feature) => {
                    const Icon = iconMap[feature.icon] || Leaf;
                    return (
                        <Card key={feature.id} className="text-center">
                            <CardHeader className="items-center">
                                <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
                                    <Icon className="h-8 w-8" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <CardTitle>{locale === 'ar' ? feature.title_ar : feature.title_fr}</CardTitle>
                                <p className="mt-2 text-muted-foreground">{locale === 'ar' ? feature.description_ar : feature.description_fr}</p>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
             {!isLoading && (!features || features.length === 0) && (
                <p className='text-muted-foreground text-center col-span-full'>{t('dashboard.common.loading')}</p>
             )}
        </div>
    );
}
