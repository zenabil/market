'use client';

import Image from 'next/image';
import { ShieldCheck, Code, Users, Leaf } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useCollection, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import type { TeamMember } from '@/lib/placeholder-data';
import { collection, query, doc, where } from 'firebase/firestore';
import { useLanguage } from '@/contexts/language-provider';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'À Propos',
  description: 'Apprenez-en plus sur l\'histoire, les valeurs et l\'équipe de Tlemcen Smart Supermarket.',
  openGraph: {
      title: 'À Propos de Tlemcen Smart Supermarket',
      description: 'Découvrez notre engagement envers la qualité, la communauté et l\'innovation.',
  },
};

const values = [
    {
        icon: Leaf,
        titleKey: "qualityFreshness",
        descriptionKey: "qualityFreshnessDesc"
    },
    {
        icon: Code,
        titleKey: "smartTechnology",
        descriptionKey: "smartTechnologyDesc"
    },
    {
        icon: Users,
        titleKey: "communitySpirit",
        descriptionKey: "communitySpiritDesc"
    },
    {
        icon: ShieldCheck,
        titleKey: "qualityCommitment",
        descriptionKey: "qualityCommitmentDesc"
    }
]

type PageContent = {
    title_fr: string;
    content_fr: string;
    title_ar: string;
    content_ar: string;
};


export default function AboutPage() {
  const { t, locale } = useLanguage();
  const firestore = useFirestore();
  
  const teamQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'teamMembers'));
  }, [firestore]);

  const { data: team, isLoading: areMembersLoading } = useCollection<TeamMember>(teamQuery);
  
  const pageContentRef = useMemoFirebase(() => doc(firestore, 'pageContent', 'about'), [firestore]);
  const { data: pageContent, isLoading: isContentLoading } = useDoc<PageContent>(pageContentRef);

  const title = pageContent ? (locale === 'ar' ? pageContent.title_ar : pageContent.title_fr) : t('about.title');
  const content = pageContent ? (locale === 'ar' ? pageContent.content_ar : pageContent.content_fr) : `${t('about.storyP1')}\n\n${t('about.storyP2')}\n\n${t('about.storyP3')}`;
  
  const aboutImageQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'siteImages'), where('id', '==', 'about-supermarket-interior'));
  }, [firestore]);
  
  const { data: aboutImage, isLoading: isAboutImageLoading } = useCollection<{id: string, imageUrl: string, description: string, imageHint: string}>(aboutImageQuery);
  const supermarketImage = aboutImage?.[0];


  return (
    <div className="container py-8 md:py-12" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <div className="text-center mb-12">
        <h1 className="font-headline text-4xl md:text-5xl lg:text-6xl">{isContentLoading ? <Skeleton className="h-12 w-2/3 mx-auto" /> : title}</h1>
        <p className="mt-4 max-w-3xl mx-auto text-lg text-muted-foreground">{t('about.subtitle')}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
        <div className="relative aspect-square md:aspect-[4/3] rounded-lg overflow-hidden">
          {isAboutImageLoading && <Skeleton className="w-full h-full" />}
          {supermarketImage && (
            <Image
                src={supermarketImage.imageUrl}
                alt={supermarketImage.description}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                data-ai-hint={supermarketImage.imageHint}
            />
          )}
        </div>
        <div className="space-y-4 text-muted-foreground">
          <h2 className="font-headline text-2xl text-foreground">{t('about.storyTitle')}</h2>
          {isContentLoading ? (
            <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
            </div>
          ) : (
             <div className="leading-relaxed whitespace-pre-line">{content}</div>
          )}
        </div>
      </div>

        <section className="mt-16 md:mt-24 text-center">
            <h2 className="font-headline text-3xl md:text-4xl">{t('about.valuesTitle')}</h2>
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
                {values.map((value) => {
                    const Icon = value.icon;
                    return (
                        <Card key={value.titleKey} className="text-center">
                            <CardContent className="p-6">
                                <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary/20 text-primary mb-4">
                                    <Icon className="h-6 w-6"/>
                                </div>
                                <h3 className="font-bold text-lg">{t(`about.values.${value.titleKey}`)}</h3>
                                <p className="mt-2 text-sm text-muted-foreground">{t(`about.values.${value.descriptionKey}`)}</p>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
        </section>

        <section className="mt-16 md:mt-24 text-center">
            <h2 className="font-headline text-3xl md:text-4xl">{t('about.teamTitle')}</h2>
            <p className="mt-2 text-muted-foreground">{t('about.teamSubtitle')}</p>
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                {areMembersLoading && Array.from({length: 3}).map((_, i) => (
                    <div key={i} className="flex flex-col items-center">
                        <Skeleton className="h-24 w-24 rounded-full mb-4" />
                        <Skeleton className="h-6 w-32 mb-1" />
                        <Skeleton className="h-4 w-48" />
                    </div>
                ))}
                {!areMembersLoading && team && team.map((member) => (
                    <div key={member.name} className="flex flex-col items-center">
                        <Avatar className="h-24 w-24 mb-4">
                            <AvatarImage src={member.avatar} alt={member.name} />
                            <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <h3 className="font-bold">{member.name}</h3>
                        <p className="text-sm text-primary">{t(`teamRoles.${member.role}`)}</p>
                    </div>
                ))}
            </div>
             {!areMembersLoading && (!team || team.length === 0) && (
                <p className='text-muted-foreground mt-8'>{t('about.teamComingSoon')}</p>
             )}
        </section>
    </div>
  );
}
