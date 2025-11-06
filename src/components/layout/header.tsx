'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Menu, LogOut, ShoppingBasket, LayoutDashboard, Wand2, CalendarDays, Bell, GitCompareArrows } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import Logo from '@/components/icons/logo';
import { ThemeSwitcher } from './theme-switcher';
import CartIcon from '../cart/cart-icon';
import CartSheet from '../cart/cart-sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePathname, useRouter } from 'next/navigation';
import { useUser, useAuth, useDoc, useFirestore, useMemoFirebase, useCollection, errorEmitter, FirestorePermissionError } from '@/firebase';
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

const navLinks = [
  { key: 'Accueil', href: '/' },
  { key: 'Produits', href: '/products' },
  { key: 'Recettes', href: '/recipes' },
  { key: 'Comparer', href: '/compare', icon: GitCompareArrows },
  { key: 'Générer une recette', href: '/generate-recipe', icon: Wand2 },
  { key: 'Planificateur de Repas', href: '/meal-planner', icon: CalendarDays },
  { key: 'À Propos', href: '/about' },
  { key: 'Contact', href: '/contact' },
];

function NotificationBell() {
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
        if (interval > 1) return Math.floor(interval) + " a";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " m";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " j";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " h";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " min";
        return Math.floor(seconds) + " s";
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
                    Notifications
                    {unreadCount > 0 && <Button variant="link" size="sm" className="p-0 h-auto" onClick={handleMarkAllAsRead}>Marquer comme lu</Button>}
                </DropdownMenuLabel>
                <Separator />
                <ScrollArea className="h-80">
                    {notifications && notifications.length > 0 ? (
                        notifications.map(notif => (
                            <DropdownMenuItem key={notif.id} asChild>
                                <Link href={notif.link || '#'} className={cn("flex items-start gap-3 whitespace-normal", !notif.isRead && "bg-primary/10")}>
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
                            Vous n'avez aucune notification.
                        </div>
                    )}
                </ScrollArea>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function UserNav() {
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
        <Link href="/login">Connexion / Inscription</Link>
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
            <p className="text-sm font-medium leading-none">{firestoreUser?.name || 'Bienvenue'}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {authUser.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
            <Link href="/dashboard/orders">
                <ShoppingBasket className="mr-2 h-4 w-4" />
                <span>Mes commandes</span>
            </Link>
        </DropdownMenuItem>
        {isAdmin && (
            <DropdownMenuItem asChild>
                <Link href="/dashboard">
                     <LayoutDashboard className="mr-2 h-4 w-4" />
                    <span>Tableau de bord</span>
                </Link>
            </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Déconnexion</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


export default function Header() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const isMobile = useIsMobile();
  const pathname = usePathname();
  const router = useRouter();

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

  const NavLinks = ({ className }: { className?: string }) => (
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
          {link.key}
        </Link>
      ))}
    </nav>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        {isMobile && (
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="mr-4">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Ouvrir le menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[400px]">
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
                       {link.key}
                    </Link>
                  </SheetClose>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        )}
        
        <Link href="/" className="mr-6 hidden md:flex">
          <Logo className="h-8 w-auto" />
        </Link>

        <NavLinks className="hidden md:flex" />

        <div className="flex flex-1 items-center justify-end space-x-2">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  name="search"
                  placeholder="Rechercher des produits..."
                  className="w-full bg-secondary md:w-[200px] lg:w-[300px] pl-9"
                />
              </div>
            </form>
          </div>
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
