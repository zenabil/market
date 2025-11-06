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

// Initialize a temporary Firebase app instance for server-side data fetching
if (!getApps().length) {
  initializeApp(firebaseConfig);
}

export async function generateMetadata(
  {},
  parent: ResolvingMetadata
): Promise<Metadata> {
  let siteName = 'Tlemcen Smart Supermarket';
  let siteDescription = 'Votre supermarché local à Tlemcen, maintenant en ligne avec des fonctionnalités intelligentes.';

  try {
    const db = getFirestore();
    const settingsRef = doc(db, 'settings', 'site');
    const settingsSnap = await getDoc(settingsRef);

    if (settingsSnap.exists()) {
      const settingsData = settingsSnap.data();
      siteName = settingsData.siteName || siteName;
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
  };
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" dir="ltr" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Alegreya:ital,wght@0,400..900;1,400..900&family=Belleza&display=swap" rel="stylesheet" />
      </head>
      <body className={cn('font-body antialiased min-h-screen flex flex-col bg-muted/40')}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
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
        </ThemeProvider>
      </body>
    </html>
  );
}
