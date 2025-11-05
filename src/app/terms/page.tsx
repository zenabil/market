'use client';

import { useLanguage } from '@/hooks/use-language';

export default function TermsPage() {
  const { t } = useLanguage();

  return (
    <div className="container py-8 md:py-12">
       <div className="prose dark:prose-invert mx-auto">
        <h1>{t('footer.terms_of_service')}</h1>
        <p>
           {t('legal.last_updated')}
        </p>

        <h2>1. {t('legal.t1_title')}</h2>
        <p>{t('legal.t1_text')}</p>

        <h2>2. {t('legal.t2_title')}</h2>
        <p>{t('legal.t2_text')}</p>
        
        <h2>3. {t('legal.t3_title')}</h2>
        <p>{t('legal.t3_text')}</p>

        <h2>4. {t('legal.t4_title')}</h2>
        <p>{t('legal.t4_text')}</p>

        <h2>5. {t('legal.t5_title')}</h2>
        <p>{t('legal.t5_text')}</p>

        <h2>{t('legal.contact_title')}</h2>
        <p>{t('legal.contact_text')} <a href="mailto:support@tlemcensmart.dz">support@tlemcensmart.dz</a>.</p>
      </div>
    </div>
  );
}
