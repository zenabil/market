'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Menu, LogOut, ShoppingBasket, LayoutDashboard, Wand2 } from 'lucide-react';
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
import { useUser, useAuth, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { User as FirestoreUser } from '@/lib/placeholder-data';
import { doc } from 'firebase/firestore';
import { useUserRole } from '@/hooks/use-user-role';


const navLinks = [
  { key: 'Accueil', href: '/' },
  { key: 'Produits', href: '/products' },
  { key: 'Recettes', href: '/recipes' },
  { key: 'Générer une recette', href: '/generate-recipe', icon: Wand2 },
  { key: 'À Propos', href: '/about' },
  { key: 'Contact', href: '/contact' },
];

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
       <div className='flex items-center gap-2'>
        <Button asChild variant="ghost">
          <Link href="/login">Connexion</Link>
        </Button>
        <Button asChild>
          <Link href="/login">Inscription</Link>
        </Button>
      </div>
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
              link.icon && "text-primary hover:text-primary/80 font-bold"
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
          <UserNav />
          <CartIcon onClick={() => setIsCartOpen(true)} />
        </div>
      </div>
      <CartSheet open={isCartOpen} onOpenChange={setIsCartOpen} />
    </header>
  );
}
