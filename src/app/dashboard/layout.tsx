'use client';

import React from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarTrigger,
  SidebarInset,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import Logo from '@/components/icons/logo';
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingBasket,
  Ticket,
  Percent,
  Settings,
  LogOut,
  ChevronLeft,
  User,
  LayoutGrid,
  Heart,
  BookOpen,
  List,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useAuth, useUser } from '@/firebase';
import { useUserRole } from '@/hooks/use-user-role';

const adminMenuItems = [
  {
    key: 'Tableau de bord',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    key: 'Commandes',
    href: '/dashboard/orders',
    icon: ShoppingBasket,
  },
  {
    key: 'Produits',
    href: '/dashboard/products',
    icon: Package,
  },
  {
    key: 'Recettes',
    href: '/dashboard/recipes',
    icon: BookOpen,
  },
  {
    key: 'Catégories',
    href: '/dashboard/categories',
    icon: LayoutGrid,
  },
  {
    key: 'Utilisateurs',
    href: '/dashboard/users',
    icon: Users,
  },
  {
    key: 'Coupons',
    href: '/dashboard/coupons',
    icon: Ticket,
  },
  {
    key: 'Réductions',
    href: '/dashboard/discounts',
    icon: Percent,
  },
  {
    key: 'Paramètres',
    href: '/dashboard/settings',
    icon: Settings,
  },
];

const userMenuItems = [
    {
        key: 'Mes commandes',
        href: '/dashboard/orders',
        icon: ShoppingBasket,
    },
    {
        key: 'Mes listes de courses',
        href: '/dashboard/shopping-lists',
        icon: List,
    },
    {
        key: 'Ma liste de souhaits',
        href: '/dashboard/wishlist',
        icon: Heart,
    },
    {
        key: 'Mon profil',
        href: '/dashboard/profile',
        icon: User,
    }
]


function DashboardSidebar() {
  const pathname = usePathname();
  const { state, setOpen } = useSidebar();
  const { user } = useUser();
  const auth = useAuth();
  const { isAdmin } = useUserRole();

  const handleLogout = async () => {
    if (auth) {
        await auth.signOut();
    }
  };


  const isCollapsed = state === 'collapsed';
  const menuItems = isAdmin ? adminMenuItems : userMenuItems;

  return (
    <Sidebar
      collapsible={isCollapsed ? 'icon' : 'offcanvas'}
      className={cn(isCollapsed && 'group-data-[collapsible=icon]:w-14')}
    >
      <SidebarHeader className={cn("p-4", isCollapsed && "p-2")}>
        <div className='flex justify-between items-center'>
            <Logo className={cn("h-8", isCollapsed && "hidden")} />
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(false)}>
                <ChevronLeft />
            </Button>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.key}>
              <Link href={item.href}>
                <SidebarMenuButton
                  isActive={pathname.startsWith(item.href) && (item.href !== '/dashboard' || pathname === '/dashboard')}
                  tooltip={{ content: item.key }}
                  className={cn(isCollapsed && 'justify-center')}
                >
                  <item.icon />
                  <span className={cn(isCollapsed && 'hidden')}>{item.key}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-2">
        <div className={cn('flex items-center gap-2 p-2 rounded-md bg-muted', isCollapsed && 'justify-center p-0 bg-transparent')}>
           <Avatar className="h-9 w-9">
              <AvatarImage src={user?.photoURL || `https://picsum.photos/seed/${user?.uid}/100/100`} alt={user?.displayName || 'User'} />
              <AvatarFallback>{user?.displayName?.charAt(0) || user?.email?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className={cn('flex flex-col', isCollapsed && 'hidden')}>
              <span className='text-sm font-semibold'>{user?.displayName || 'User'}</span>
              <span className='text-xs text-muted-foreground'>{user?.email}</span>
            </div>
        </div>
        <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton onClick={handleLogout} className={cn(isCollapsed && 'justify-center')}>
                    <LogOut />
                    <span className={cn(isCollapsed && 'hidden')}>Déconnexion</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider defaultOpen={true}>
      <DashboardSidebar />
      <SidebarInset className="bg-muted/40">
        <header className='p-4 bg-background md:hidden'>
          <SidebarTrigger />
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
