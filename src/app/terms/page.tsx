
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

export default function TermsPage() {
  const { t, locale } = useLanguage();
  const firestore = useFirestore();
  
  const pageContentRef = useMemoFirebase(() => doc(firestore, 'pageContent', 'terms'), [firestore]);
  const { data: pageContent, isLoading: isContentLoading } = useDoc<PageContent>(pageContentRef);

  const title = pageContent ? (locale === 'ar' ? pageContent.title_ar : pageContent.title_fr) : t('terms.title');
  const content = pageContent ? (locale === 'ar' ? pageContent.content_ar : pageContent.content_fr) : `
      <h2>${t('terms.acceptance.title')}</h2>
      <p>${t('terms.acceptance.p1')}</p>

      <h2>${t('terms.siteUsage.title')}</h2>
      <p>${t('terms.siteUsage.p1')}</p>
      
      <h2>${t('terms.userAccounts.title')}</h2>
      <p>${t('terms.userAccounts.p1')}</p>

      <h2>${t('terms.liability.title')}</h2>
      <p>${t('terms.liability.p1')}</p>

      <h2>${t('terms.changes.title')}</h2>
      <p>${t('terms.changes.p1')}</p>

      <h2>${t('terms.contactUs.title')}</h2>
      <p>
          ${t('terms.contactUs.p1')}
          <a href="mailto:support@tlemcensmart.dz">support@tlemcensmart.dz</a>.
      </p>
  `;

  return (
    <div className="container py-8 md:py-12">
       <div className="prose dark:prose-invert mx-auto max-w-3xl">
        <h1>{isContentLoading ? <Skeleton className="h-10 w-3/4" /> : title}</h1>
        <p>{t('terms.lastUpdated')}</p>
        
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

    