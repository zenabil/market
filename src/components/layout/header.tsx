'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, Menu, User, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/use-language';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import Logo from '@/components/icons/logo';
import { ThemeSwitcher } from './theme-switcher';
import LanguageSwitcher from './language-switcher';
import CartIcon from '../cart/cart-icon';
import CartSheet from '../cart/cart-sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePathname } from 'next/navigation';
import { useUser, useAuth } from '@/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const navLinks = [
  { key: 'nav.home', href: '/' },
  { key: 'nav.products', href: '/products' },
  { key: 'nav.about', href: '/about' },
  { key: 'nav.contact', href: '/contact' },
  { key: 'nav.dashboard', href: '/dashboard' },
];

function UserNav() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const { t } = useLanguage();

  const handleLogout = async () => {
    await auth.signOut();
  };

  if (isUserLoading) {
    return null;
  }

  if (!user) {
    return (
      <Button asChild variant="ghost">
        <Link href="/login">{t('auth.login')}</Link>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.photoURL || `https://picsum.photos/seed/${user.uid}/100/100`} alt={user.displayName || 'User'} />
            <AvatarFallback>{user.email?.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.displayName || 'Welcome'}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>{t('auth.logout')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


export default function Header() {
  const { t } = useLanguage();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const isMobile = useIsMobile();
  const pathname = usePathname();

  if (pathname.startsWith('/dashboard') || pathname.startsWith('/login')) {
    return null;
  }
  
  const NavLinks = ({ className }: { className?: string }) => (
    <nav className={cn('flex items-center gap-4 lg:gap-6', className)}>
      {navLinks.map((link) => (
        <Link
          key={link.key}
          href={link.href}
          className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          {t(link.key)}
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
                <span className="sr-only">Open menu</span>
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
                      className="text-lg font-medium text-foreground"
                    >
                      {t(link.key)}
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
            <form>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder={t('header.search_placeholder')}
                  className="w-full bg-secondary md:w-[200px] lg:w-[300px] pl-9"
                />
              </div>
            </form>
          </div>
          <LanguageSwitcher />
          <ThemeSwitcher />
          <UserNav />
          <CartIcon onClick={() => setIsCartOpen(true)} />
        </div>
      </div>
      <CartSheet open={isCartOpen} onOpenChange={setIsCartOpen} />
    </header>
  );
}
