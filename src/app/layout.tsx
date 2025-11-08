

import type { Metadata, ResolvingMetadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { ThemeProvider } from '@/contexts/theme-provider';
import { CartProvider } from '@/contexts/cart-provider';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { FirebaseClientProvider } from '@/firebase';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';
import { ComparisonProvider } from '@/contexts/comparison-provider';
import ComparisonBar from '@/components/product/comparison-bar';
import { LanguageProvider } from '@/contexts/language-provider';
import { Cairo, Readex_Pro } from 'next/font/google';
import { WithContext, WebSite, Organization } from 'schema-dts';
import Script from 'next/script';

// AI Flow imports
import '@/ai/flows/generate-product-description.ts';
import '@/ai/flows/product-recommendations.ts';
import '@/ai/flows/ai-support-chatbot.ts';
import '@/ai/flows/generate-recipe-from-ingredients.ts';
import '@/ai/flows/analyze-shopping-list.ts';
import '@/ai/flows/generate-weekly-meal-plan.ts';
import '@/ai/flows/identify-product-flow.ts';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  variable: '--font-body',
  display: 'swap',
});

const readexPro = Readex_Pro({
  subsets: ['arabic', 'latin'],
  variable: '--font-headline',
  display: 'swap',
});

// Initialize a temporary Firebase app instance for server-side data fetching
if (!getApps().length) {
  initializeApp(firebaseConfig);
}

export async function generateMetadata(
  {},
  parent: ResolvingMetadata
): Promise<Metadata> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  
  // Default values
  let siteName = 'Tlemcen Smart Supermarket';
  let siteDescription = 'Your local Tlemcen grocery store, now online with smart features. Fresh products, fast delivery, and smart shopping.';
  let siteSettings: { [key: string]: any } = {};

  try {
    const db = getFirestore();
    const settingsRef = doc(db, 'settings', 'site');
    const settingsSnap = await getDoc(settingsRef);

    if (settingsSnap.exists()) {
      siteSettings = settingsSnap.data();
      siteName = siteSettings.siteName || siteName;
    }
  } catch (error) {
    console.error("Could not fetch site settings for metadata:", error);
  }
  
  const socialUrls = [
    siteSettings.facebookUrl,
    siteSettings.instagramUrl,
    siteSettings.twitterUrl,
  ].filter(Boolean);

  const organizationSchema: WithContext<Organization> = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${baseUrl}/#organization`,
    name: siteName,
    url: baseUrl,
    logo: siteSettings.logoUrl || `${baseUrl}/logo.png`, // Fallback logo
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: siteSettings.phone,
      contactType: 'Customer Service',
    },
    address: {
      '@type': 'PostalAddress',
      streetAddress: siteSettings.address,
      addressLocality: 'Tlemcen',
      addressCountry: 'DZ',
    },
    sameAs: socialUrls,
  };

  const websiteSchema: WithContext<WebSite> = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${baseUrl}/#website`,
    name: siteName,
    url: baseUrl,
    publisher: {
      '@id': `${baseUrl}/#organization`,
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: siteName,
      template: `%s | ${siteName}`,
    },
    description: siteDescription,
    keywords: ['supermarket', 'Tlemcen', 'grocery', 'online shopping', 'food', 'supermarché', 'épicerie', 'سوبر ماركت', 'تلمسان', 'بقالة'],
    openGraph: {
      title: siteName,
      description: siteDescription,
      url: new URL(baseUrl),
      siteName: siteName,
      images: [
        {
          url: siteSettings.logoUrl || 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?q=80&w=1080',
          width: 1200,
          height: 630,
          alt: 'Tlemcen Smart Supermarket',
        },
      ],
      locale: 'fr_FR',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: siteName,
      description: siteDescription,
      images: [siteSettings.logoUrl || 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?q=80&w=1080'],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    other: {
      jsonLd: JSON.stringify([organizationSchema, websiteSchema]),
    }
  };
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-${process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID}`}
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body className={cn('font-body antialiased min-h-screen flex flex-col bg-muted/40', cairo.variable, readexPro.variable)}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
         <LanguageProvider>
          <CartProvider>
            <FirebaseClientProvider>
                <ComparisonProvider>
                    <Header />
                    <main className="flex-grow">{children}</main>
                    <Footer />
                    <Toaster />
                    <ComparisonBar />
                </ComparisonProvider>
            </FirebaseClientProvider>
          </CartProvider>
         </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
