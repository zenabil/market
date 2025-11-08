

'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Search,
  Menu,
  LogOut,
  ShoppingBasket,
  LayoutDashboard,
  Wand2,
  CalendarDays,
  Bell,
  GitCompareArrows,
  Globe,
  Star,
  Camera,
  Command,
  User,
  LogIn,
  UserPlus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import Logo from '@/components/icons/logo';
import { ThemeSwitcher } from './theme-switcher';
import CartIcon from '../cart/cart-icon';
import CartSheet from '../cart/cart-sheet';
import { usePathname, useRouter } from 'next/navigation';
import { useUser, useAuth, useDoc, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { User as FirestoreUser, Notification } from '@/lib/placeholder-data';
import { doc, collection, query, orderBy, writeBatch } from 'firebase/firestore';
import { useUserRole } from '@/hooks/use-user-role';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import { useLanguage } from '@/contexts/language-provider';
import ImageSearchDialog from './image-search-dialog';
import { Dialog, DialogContent, DialogTitle } from '../ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import dynamic from 'next/dynamic';

const AiChatbot = dynamic(() => import('@/components/chatbot/ai-chatbot'), { ssr: false });


function SearchCommandMenu() {
    const { t } = useLanguage();
    const [open, setOpen] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };
        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const searchQuery = formData.get('search') as string;
        if (searchQuery.trim()) {
            router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
            setOpen(false);
        }
    };
    
    return (
        <>
            <Button
                variant="outline"
                className="relative h-10 w-10 p-0 sm:w-64 sm:justify-start sm:px-4"
                onClick={() => setOpen(true)}
            >
                <Search className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline-block">{t('header.searchPlaceholder')}</span>
                <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs font-medium opacity-100 sm:flex">
                    <span className="text-sm">⌘</span>K
                </kbd>
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="overflow-hidden p-0 shadow-lg top-1/4 sm:top-1/3">
                    <VisuallyHidden>
                      <DialogTitle>{t('header.searchPlaceholder')}</DialogTitle>
                    </VisuallyHidden>
                    <form onSubmit={handleSearch}>
                        <div className="flex items-center border-b px-3">
                            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                            <Input
                                name="search"
                                className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 border-0 focus-visible:ring-0"
                                placeholder={t('header.searchPlaceholder')}
                            />
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    )
}

function LanguageSwitcher() {
    const { locale, setLocale } = useLanguage();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                    <Globe className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setLocale('ar')} disabled={locale === 'ar'}>
                    العربية
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocale('fr')} disabled={locale === 'fr'}>
                    Français
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function NavLinks({ className, inSheet = false }: { className?: string, inSheet?: boolean }) {
    const { t } = useLanguage();
    
    const navLinks = [
      { key: 'home', href: '/' },
      { key: 'products', href: '/products' },
      { key: 'recipes', href: '/recipes' },
      { key: 'features', href: '/features' },
    ];

    const aiLinks = [
      { key: 'generateRecipe', href: '/generate-recipe', icon: Wand2 },
      { key: 'mealPlanner', href: '/meal-planner', icon: CalendarDays },
    ];
    
    const secondaryLinks = [
      { key: 'about', href: '/about' },
      { key: 'contact', href: '/contact' },
    ];

    const allLinks = [...navLinks, ...secondaryLinks];

    if (inSheet) {
        return (
            <div className="flex flex-col gap-4">
                {allLinks.map((link) => (
                   <SheetClose asChild key={link.key}>
                    <Link
                      href={link.href}
                      className={cn(
                        "text-lg font-medium text-foreground flex items-center gap-2",
                         link.icon && "text-primary"
                        )}
                    >
                       {link.icon && <link.icon className="h-5 w-5" />}
                       {t(`header.${link.key}`)}
                    </Link>
                  </SheetClose>
                ))}
                 <Separator className="my-2" />
                 <p className="text-sm font-semibold text-muted-foreground px-2">AI Tools</p>
                 {aiLinks.map((link) => (
                     <SheetClose asChild key={link.key}>
                        <Link href={link.href} className="text-lg font-medium text-foreground flex items-center gap-2 text-primary">
                            <link.icon className="h-5 w-5" />
                            {t(`header.${link.key}`)}
                        </Link>
                     </SheetClose>
                 ))}
            </div>
        )
    }

    return (
        <nav className={cn('items-center gap-4 lg:gap-6', className)}>
            {navLinks.map((link) => (
                <Link
                key={link.key}
                href={link.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                {t(`header.${link.key}`)}
                </Link>
            ))}
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="text-sm font-medium text-muted-foreground p-0 h-auto hover:text-foreground">
                        <Star className="mr-2 h-4 w-4 text-primary/80" />
                        AI Tools
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    {aiLinks.map((link) => (
                        <DropdownMenuItem key={link.key} asChild>
                            <Link href={link.href}>
                                <link.icon className="mr-2 h-4 w-4"/>
                                {t(`header.${link.key}`)}
                            </Link>
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </nav>
    )
}

function MobileNav() {
    return (
        <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Ouvrir le menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[400px]">
              <Link href="/" className="mb-8 block">
                <Logo className="h-8" />
              </Link>
              <NavLinks inSheet={true} />
            </SheetContent>
        </Sheet>
    )
}


function NotificationBell() {
    const { t } = useLanguage();
    const { user } = useUser();
    const firestore = useFirestore();
    const notificationsQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(collection(firestore, `users/${user.uid}/notifications`), orderBy('createdAt', 'desc'));
    }, [user, firestore]);

    const { data: notifications } = useCollection<Notification>(notificationsQuery);
    const unreadCount = notifications?.filter(n => !n.isRead).length || 0;

    const handleMarkAllAsRead = async () => {
        if (!firestore || !user || !notifications || unreadCount === 0) return;

        const batch = writeBatch(firestore);
        notifications.forEach(notif => {
            if (!notif.isRead) {
                const notifRef = doc(firestore, `users/${user.uid}/notifications`, notif.id);
                batch.update(notifRef, { isRead: true });
            }
        });

        try {
            await batch.commit();
        } catch (error) {
            console.error("Failed to mark notifications as read", error);
        }
    };

    const timeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return t('header.time.yearsAgo', { count: Math.floor(interval) });
        interval = seconds / 2592000;
        if (interval > 1) return t('header.time.monthsAgo', { count: Math.floor(interval) });
        interval = seconds / 86400;
        if (interval > 1) return t('header.time.daysAgo', { count: Math.floor(interval) });
        interval = seconds / 3600;
        if (interval > 1) return t('header.time.hoursAgo', { count: Math.floor(interval) });
        interval = seconds / 60;
        if (interval > 1) return t('header.time.minutesAgo', { count: Math.floor(interval) });
        return t('header.time.secondsAgo', { count: Math.floor(seconds) });
    };

    if (!user) return null;

    return (
        <DropdownMenu onOpenChange={(open) => open && unreadCount > 0 && handleMarkAllAsRead()}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs font-bold text-destructive-foreground">
                            {unreadCount}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80 md:w-96" align="end">
                <DropdownMenuLabel className="flex justify-between items-center">
                    {t('header.notifications')}
                </DropdownMenuLabel>
                <Separator />
                <ScrollArea className="h-80">
                    {notifications && notifications.length > 0 ? (
                        notifications.map(notif => (
                            <DropdownMenuItem key={notif.id} asChild>
                                <Link href={notif.link || '#'} className={cn("flex items-start gap-3 whitespace-normal", !notif.isRead && "font-bold")}>
                                     {!notif.isRead && <div className="h-2 w-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />}
                                    <div className={cn("flex-grow", notif.isRead && "pl-4")}>
                                        <p className="text-sm">{notif.message}</p>
                                        <p className="text-xs text-muted-foreground mt-1">{timeAgo(notif.createdAt)}</p>
                                    </div>
                                </Link>
                            </DropdownMenuItem>
                        ))
                    ) : (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                            {t('header.noNotifications')}
                        </div>
                    )}
                </ScrollArea>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function UserNav() {
  const { t } = useLanguage();
  const { user: authUser, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const { isAdmin } = useUserRole();

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !authUser) return null;
    return doc(firestore, 'users', authUser.uid);
  }, [firestore, authUser]);

  const { data: firestoreUser } = useDoc<FirestoreUser>(userDocRef);

  const handleLogout = async () => {
    if (auth) {
        await auth.signOut();
    }
  };

  if (isUserLoading) {
    return null;
  }

  if (!authUser) {
     return (
        <Button variant="default" asChild>
            <Link href="/login">{t('login.tabs.login')}</Link>
        </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarImage src={authUser.photoURL || `https://picsum.photos/seed/${authUser.uid}/100/100`} alt={firestoreUser?.name || 'User'} />
            <AvatarFallback>{firestoreUser?.name?.charAt(0).toUpperCase() || authUser.email?.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{firestoreUser?.name || t('header.welcome')}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {authUser.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
            <Link href="/dashboard/orders">
                <ShoppingBasket className="mr-2 h-4 w-4" />
                <span>{t('header.myOrders')}</span>
            </Link>
        </DropdownMenuItem>
        {isAdmin && (
            <DropdownMenuItem asChild>
                <Link href="/dashboard">
                     <LayoutDashboard className="mr-2 h-4 w-4" />
                    <span>{t('header.dashboard')}</span>
                </Link>
            </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>{t('header.logout')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

type SiteSettings = {
  logoUrl?: string;
}

export default function Header() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const pathname = usePathname();
  const { t } = useLanguage();
  const firestore = useFirestore();
  
  const settingsRef = useMemoFirebase(() => doc(firestore, 'settings', 'site'), [firestore]);
  const { data: settings } = useDoc<SiteSettings>(settingsRef);

  if (pathname.startsWith('/dashboard') || pathname.startsWith('/login')) {
    return null;
  }

  return (
    <>
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <MobileNav />
        
        <Link href="/" className="mr-8 hidden md:flex">
          <Logo className="h-8 w-auto" logoUrl={settings?.logoUrl} />
        </Link>

        <div className="hidden md:flex flex-1">
            <NavLinks className="flex" />
        </div>

        <div className="flex flex-1 items-center justify-end space-x-1 md:space-x-2">
          
          <div className="hidden sm:flex items-center gap-2">
            <SearchCommandMenu />
          </div>

          <ImageSearchDialog>
            <Button variant="ghost" size="icon">
                <Camera className="h-5 w-5" />
                <span className="sr-only">Search by image</span>
            </Button>
          </ImageSearchDialog>
          
          <NotificationBell />
          <UserNav />
          <ThemeSwitcher />
          <LanguageSwitcher />
          <CartIcon onClick={() => setIsCartOpen(true)} />
        </div>
      </div>
      <CartSheet open={isCartOpen} onOpenChange={setIsCartOpen} />
    </header>
    <AiChatbot />
    </>
  );
}
