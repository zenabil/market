'use client';

import { useLanguage } from '@/hooks/use-language';

export default function PrivacyPage() {
  const { t } = useLanguage();

  return (
    <div className="container py-8 md:py-12">
      <div className="prose dark:prose-invert mx-auto">
        <h1>{t('footer.privacy_policy')}</h1>
        <p>
          {t('legal.last_updated')}
        </p>

        <h2>{t('legal.p1_title')}</h2>
        <p>{t('legal.p1_text')}</p>

        <h2>{t('legal.p2_title')}</h2>
        <p>{t('legal.p2_text')}</p>
        <ul>
            <li>{t('legal.p2_l1')}</li>
            <li>{t('legal.p2_l2')}</li>
            <li>{t('legal.p2_l3')}</li>
        </ul>

        <h2>{t('legal.p3_title')}</h2>
        <p>{t('legal.p3_text')}</p>
        
        <h2>{t('legal.p4_title')}</h2>
        <p>{t('legal.p4_text')}</p>

        <h2>{t('legal.p5_title')}</h2>
        <p>{t('legal.p5_text')}</p>

        <h2>{t('legal.contact_title')}</h2>
        <p>{t('legal.contact_text')} <a href="mailto:privacy@tlemcensmart.dz">privacy@tlemcensmart.dz</a>.</p>
      </div>
    </div>
  );
}
