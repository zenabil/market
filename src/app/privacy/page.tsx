
'use client';

import { useLanguage } from '@/contexts/language-provider';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

type PageContent = {
    title_fr: string;
    content_fr: string;
    title_ar: string;
    content_ar: string;
};

export default function PrivacyPage() {
  const { t, locale } = useLanguage();
  const firestore = useFirestore();
  
  const pageContentRef = useMemoFirebase(() => doc(firestore, 'pageContent', 'privacy'), [firestore]);
  const { data: pageContent, isLoading: isContentLoading } = useDoc<PageContent>(pageContentRef);

  const title = pageContent ? (locale === 'ar' ? pageContent.title_ar : pageContent.title_fr) : t('privacy.title');
  const content = pageContent ? (locale === 'ar' ? pageContent.content_ar : pageContent.content_fr) : `
      <h2>${t('privacy.introduction.title')}</h2>
      <p>${t('privacy.introduction.p1')}</p>

      <h2>${t('privacy.information.title')}</h2>
      <p>${t('privacy.information.p1')}</p>
      <ul>
          <li>${t('privacy.information.listItem1')}</li>
          <li>${t('privacy.information.listItem2')}</li>
          <li>${t('privacy.information.listItem3')}</li>
      </ul>

      <h2>${t('privacy.howWeUse.title')}</h2>
      <p>${t('privacy.howWeUse.p1')}</p>
      
      <h2>${t('privacy.dataSecurity.title')}</h2>
      <p>${t('privacy.dataSecurity.p1')}</p>

      <h2>${t('privacy.policyChanges.title')}</h2>
      <p>${t('privacy.policyChanges.p1')}</p>

      <h2>${t('privacy.contactUs.title')}</h2>
      <p>
          ${t('privacy.contactUs.p1')}
          <a href="mailto:privacy@tlemcensmart.dz">privacy@tlemcensmart.dz</a>.
      </p>
  `;

  return (
    <div className="container py-8 md:py-12">
      <div className="prose dark:prose-invert mx-auto max-w-3xl" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
        <h1>{isContentLoading ? <Skeleton className="h-10 w-3/4" /> : title}</h1>
        <p className="text-muted-foreground">{t('privacy.lastUpdated')}</p>
        
        {isContentLoading ? (
            <div className="space-y-4 mt-8">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-6 w-1/3 mt-4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
            </div>
        ) : (
            <div dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br />') }} />
        )}
      </div>
    </div>
  );
}
