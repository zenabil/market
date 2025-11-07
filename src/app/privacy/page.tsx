
'use client';

import { useLanguage } from '@/contexts/language-provider';

export default function PrivacyPage() {
  const { t } = useLanguage();

  return (
    <div className="container py-8 md:py-12">
      <div className="prose dark:prose-invert mx-auto max-w-3xl">
        <h1>{t('privacy.title')}</h1>
        <p>{t('privacy.lastUpdated')}</p>

        <h2>{t('privacy.introduction.title')}</h2>
        <p>{t('privacy.introduction.p1')}</p>

        <h2>{t('privacy.information.title')}</h2>
        <p>{t('privacy.information.p1')}</p>
        <ul>
            <li>{t('privacy.information.listItem1')}</li>
            <li>{t('privacy.information.listItem2')}</li>
            <li>{t('privacy.information.listItem3')}</li>
        </ul>

        <h2>{t('privacy.howWeUse.title')}</h2>
        <p>{t('privacy.howWeUse.p1')}</p>
        
        <h2>{t('privacy.dataSecurity.title')}</h2>
        <p>{t('privacy.dataSecurity.p1')}</p>

        <h2>{t('privacy.policyChanges.title')}</h2>
        <p>{t('privacy.policyChanges.p1')}</p>

        <h2>{t('privacy.contactUs.title')}</h2>
        <p>
            {t('privacy.contactUs.p1')}
            <a href="mailto:privacy@tlemcensmart.dz">privacy@tlemcensmart.dz</a>.
        </p>
      </div>
    </div>
  );
}
