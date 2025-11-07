
'use client';

import { useLanguage } from '@/contexts/language-provider';

export default function TermsPage() {
  const { t } = useLanguage();

  return (
    <div className="container py-8 md:py-12">
       <div className="prose dark:prose-invert mx-auto max-w-3xl">
        <h1>{t('terms.title')}</h1>
        <p>{t('terms.lastUpdated')}</p>

        <h2>{t('terms.acceptance.title')}</h2>
        <p>{t('terms.acceptance.p1')}</p>

        <h2>{t('terms.siteUsage.title')}</h2>
        <p>{t('terms.siteUsage.p1')}</p>
        
        <h2>{t('terms.userAccounts.title')}</h2>
        <p>{t('terms.userAccounts.p1')}</p>

        <h2>{t('terms.liability.title')}</h2>
        <p>{t('terms.liability.p1')}</p>

        <h2>{t('terms.changes.title')}</h2>
        <p>{t('terms.changes.p1')}</p>

        <h2>{t('terms.contactUs.title')}</h2>
        <p>
            {t('terms.contactUs.p1')}
            <a href="mailto:support@tlemcensmart.dz">support@tlemcensmart.dz</a>.
        </p>
      </div>
    </div>
  );
}
