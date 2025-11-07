import type { Metadata, ResolvingMetadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { ThemeProvider } from '@/contexts/theme-provider';
import { CartProvider } from '@/contexts/cart-provider';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import AiChatbot from '@/components/chatbot/ai-chatbot';
import { FirebaseClientProvider } from '@/firebase';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';
import { ComparisonProvider } from '@/contexts/comparison-provider';
import ComparisonBar from '@/components/product/comparison-bar';
import { LanguageProvider } from '@/contexts/language-provider';

// Initialize a temporary Firebase app instance for server-side data fetching
if (!getApps().length) {
  initializeApp(firebaseConfig);
}

export async function generateMetadata(
  {},
  parent: ResolvingMetadata
): Promise<Metadata> {
  let siteName = 'Tlemcen Smart Supermarket'; // Default in English for crawlers
  let siteDescription = 'Your local Tlemcen grocery store, now online with smart features. Fresh products, fast delivery, and smart shopping.';
  let logoUrl = '';

  try {
    const db = getFirestore();
    const settingsRef = doc(db, 'settings', 'site');
    const settingsSnap = await getDoc(settingsRef);

    if (settingsSnap.exists()) {
      const settingsData = settingsSnap.data();
      siteName = settingsData.siteName || siteName;
      logoUrl = settingsData.logoUrl || '';
    }
  } catch (error) {
    console.error("Could not fetch site settings for metadata:", error);
  }

  return {
    title: {
      default: siteName,
      template: `%s | ${siteName}`,
    },
    description: siteDescription,
    keywords: ['supermarket', 'Tlemcen', 'grocery', 'online shopping', 'food', 'supermarché', 'épicerie', 'سوبر ماركت', 'تلمسان', 'بقالة'],
    openGraph: {
      title: siteName,
      description: siteDescription,
      url: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
      siteName: siteName,
      images: [
        {
          url: logoUrl || 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?q=80&w=1080',
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
      images: [logoUrl || 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?q=80&w=1080'],
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&family=Readex+Pro:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className={cn('font-body antialiased min-h-screen flex flex-col bg-muted/40')}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
         <LanguageProvider>
          <CartProvider>
            <FirebaseClientProvider>
                <ComparisonProvider>
                    <Header />
                    <main className="flex-grow">{children}</main>
                    <Footer />
                    <Toaster />
                    <AiChatbot />
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
