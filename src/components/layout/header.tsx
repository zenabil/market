'use client';

import React, { useState } from 'react';
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


function LanguageSwitcher() {
    const { locale, setLocale, t } = useLanguage();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Globe className="h-6 w-6" />
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

function NavLinks({ className }: { className?: string }) {
    const { t } = useLanguage();
    
    const navLinks = [
      { key: 'home', href: '/' },
      { key: 'products', href: '/products' },
      { key: 'recipes', href: '/recipes' },
      { key: 'compare', href: '/compare', icon: GitCompareArrows },
      { key: 'generateRecipe', href: '/generate-recipe', icon: Wand2 },
      { key: 'mealPlanner', href: '/meal-planner', icon: CalendarDays },
      { key: 'about', href: '/about' },
      { key: 'contact', href: '/contact' },
    ];

    return (
        <nav className={cn('flex items-center gap-4 lg:gap-6', className)}>
        {navLinks.map((link) => (
            <Link
            key={link.key}
            href={link.href}
            className={cn(
                "text-sm font-medium text-muted-foreground transition-colors hover:text-foreground flex items-center gap-2",
                (link.icon) && "text-primary hover:text-primary/80 font-bold"
                )}
            >
            {link.icon && <link.icon className="h-4 w-4" />}
            {t(`header.${link.key}`)}
            </Link>
        ))}
        </nav>
    )
}

function MobileNav() {
    const { t } = useLanguage();
        const navLinks = [
      { key: 'home', href: '/' },
      { key: 'products', href: '/products' },
      { key: 'recipes', href: '/recipes' },
      { key: 'compare', href: '/compare', icon: GitCompareArrows },
      { key: 'generateRecipe', href: '/generate-recipe', icon: Wand2 },
      { key: 'mealPlanner', href: '/meal-planner', icon: CalendarDays },
      { key: 'about', href: '/about' },
      { key: 'contact', href: '/contact' },
    ];

    return (
        <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="ml-4 md:hidden">
                <Menu className="h-6 w-6" />
                <span className="sr-only">{t('chatbot.open')}</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <Link href="/" className="mb-8 block">
                <Logo className="h-8" />
              </Link>
              <div className="flex flex-col gap-4">
                {navLinks.map((link) => (
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
              </div>
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
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-6 w-6" />
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
                    {unreadCount > 0 && <Button variant="link" size="sm" className="p-0 h-auto" onClick={handleMarkAllAsRead}>{t('header.markAllAsRead')}</Button>}
                </DropdownMenuLabel>
                <Separator />
                <ScrollArea className="h-80">
                    {notifications && notifications.length > 0 ? (
                        notifications.map(notif => (
                            <DropdownMenuItem key={notif.id} asChild>
                                <Link href={notif.link || '#'} className={cn("flex items-start gap-3 whitespace-normal", !notif.isRead && "bg-primary/10")}>
                                     {!notif.isRead && <div className="h-2 w-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />}
                                    <div className={cn("flex-grow", notif.isRead && "pr-4")}>
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
      <Button asChild>
        <Link href="/login">{t('header.loginRegister')}</Link>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
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
                <ShoppingBasket className="ml-2 h-4 w-4" />
                <span>{t('header.myOrders')}</span>
            </Link>
        </DropdownMenuItem>
        {isAdmin && (
            <DropdownMenuItem asChild>
                <Link href="/dashboard">
                     <LayoutDashboard className="ml-2 h-4 w-4" />
                    <span>{t('header.dashboard')}</span>
                </Link>
            </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="ml-2 h-4 w-4" />
          <span>{t('header.logout')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


export default function Header() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLanguage();

  if (pathname.startsWith('/dashboard') || pathname.startsWith('/login')) {
    return null;
  }
  
  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const searchQuery = formData.get('search') as string;
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <MobileNav />
        
        <Link href="/" className="ml-6 hidden md:flex">
          <Logo className="h-8 w-auto" />
        </Link>

        <div className="hidden md:flex flex-1">
            <NavLinks />
        </div>

        <div className="flex flex-1 items-center justify-start space-x-2">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  name="search"
                  placeholder={t('header.searchPlaceholder')}
                  className="w-full bg-secondary md:w-[200px] lg:w-[300px] pr-9"
                />
              </div>
            </form>
          </div>
          <LanguageSwitcher />
          <ThemeSwitcher />
          <NotificationBell />
          <UserNav />
          <CartIcon onClick={() => setIsCartOpen(true)} />
        </div>
      </div>
      <CartSheet open={isCartOpen} onOpenChange={setIsCartOpen} />
    </header>
  );
}
