'use client';

import React from 'react';
import Link from 'next/link';
import { Facebook, Instagram, Twitter, Phone, MapPin } from 'lucide-react';
import Logo from '../icons/logo';
import { usePathname } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useLanguage } from '@/contexts/language-provider';


type SiteSettings = {
  siteName?: string;
  phone?: string;
  address?: string;
}

export default function Footer() {
  const { t } = useLanguage();

  const navLinks = [
    { key: 'home', href: '/' },
    { key: 'products', href: '/products' },
    { key: 'about', href: '/about' },
    { key: 'contact', href: '/contact' },
  ];

  const legalLinks = [
    { key: 'privacyPolicy', href: '/privacy' },
    { key: 'termsOfUse', href: '/terms' },
  ];
  
  const currentYear = new Date().getFullYear();
  const pathname = usePathname();
  const firestore = useFirestore();

  const settingsRef = useMemoFirebase(() => doc(firestore, 'settings', 'site'), [firestore]);
  const { data: settings } = useDoc<SiteSettings>(settingsRef);

  const siteName = settings?.siteName || t('defaultSiteName');


  if (pathname.startsWith('/dashboard') || pathname.startsWith('/login')) {
    return null;
  }

  return (
    <footer className="border-t bg-background">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1 space-y-4">
            <Link href="/">
              <Logo className="h-8" />
            </Link>
            <p className="text-muted-foreground text-sm max-w-xs">
              {t('footer.tagline')}
            </p>
            <div className="flex space-x-4">
              <Link href="#" className="text-muted-foreground hover:text-foreground">
                <Facebook size={20} />
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground">
                <Instagram size={20} />
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground">
                <Twitter size={20} />
              </Link>
            </div>
          </div>
          <div>
            <h4 className="font-headline text-lg mb-4">{t('footer.quickLinks')}</h4>
            <ul className="space-y-2">
              {navLinks.map((link) => (
                <li key={link.key}>
                  <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground">
                    {t(`header.${link.key}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-headline text-lg mb-4">{t('footer.legal')}</h4>
            <ul className="space-y-2">
              {legalLinks.map((link) => (
                <li key={link.key}>
                  <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground">
                    {t(`footer.${link.key}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-headline text-lg mb-4">{t('footer.contactUs')}</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
                {settings?.phone && (
                    <li className='flex items-start gap-2'>
                        <Phone className="h-4 w-4 mt-0.5 shrink-0"/>
                        <span>{settings.phone}</span>
                    </li>
                )}
                {settings?.address && (
                    <li className='flex items-start gap-2'>
                        <MapPin className="h-4 w-4 mt-0.5 shrink-0"/>
                        <span>{settings.address}</span>
                    </li>
                )}
             </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t flex flex-col sm:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground">
            {t('footer.copyright').replace('{{year}}', currentYear.toString()).replace('{{siteName}}', siteName)}
          </p>
        </div>
      </div>
    </footer>
  );
}
