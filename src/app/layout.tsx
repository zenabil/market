import type { Metadata, ResolvingMetadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { ThemeProvider } from '@/contexts/theme-provider';
import { LanguageProvider } from '@/contexts/language-provider';
import { CartProvider } from '@/contexts/cart-provider';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import AiChatbot from '@/components/chatbot/ai-chatbot';
import { FirebaseClientProvider } from '@/firebase';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

// Initialize a temporary Firebase app instance for server-side data fetching
if (!getApps().length) {
  initializeApp(firebaseConfig);
}

export async function generateMetadata(
  {},
  parent: ResolvingMetadata
): Promise<Metadata> {
  let siteName = 'Tlemcen Smart Supermarket';
  let siteDescription = 'Your local supermarket in Tlemcen, now online with smart features.';

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
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Alegreya:ital,wght@0,400..900;1,400..900&family=Belleza&display=swap" rel="stylesheet" />
      </head>
      <body className={cn('font-body antialiased min-h-screen flex flex-col bg-muted/40')}>
        <FirebaseClientProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <LanguageProvider>
              <CartProvider>
                <Header />
                <main className="flex-grow">{children}</main>
                <Footer />
                <Toaster />
                <AiChatbot />
              </CartProvider>
            </LanguageProvider>
          </ThemeProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
