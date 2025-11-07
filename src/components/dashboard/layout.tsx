

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
  Mail,
  UserSquare,
  FileText,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { cn } from '@/lib/utils';
import { useAuth, useUser } from '@/firebase';
import { useUserRole } from '@/hooks/use-user-role';
import { useLanguage } from '@/contexts/language-provider';

const adminMenuItems = [
  {
    key: 'dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    key: 'orders',
    href: '/dashboard/orders',
    icon: ShoppingBasket,
  },
  {
    key: 'products',
    href: '/dashboard/products',
    icon: Package,
  },
   {
    key: 'content',
    href: '/dashboard/content',
    icon: FileText,
  },
  {
    key: 'recipes',
    href: '/dashboard/recipes',
    icon: BookOpen,
  },
  {
    key: 'categories',
    href: '/dashboard/categories',
    icon: LayoutGrid,
  },
  {
    key: 'users',
    href: '/dashboard/users',
    icon: Users,
  },
    {
    key: 'messages',
    href: '/dashboard/messages',
    icon: Mail,
  },
  {
    key: 'coupons',
    href: '/dashboard/coupons',
    icon: Ticket,
  },
  {
    key: 'discounts',
    href: '/dashboard/discounts',
    icon: Percent,
  },
   {
    key: 'team',
    href: '/dashboard/team',
    icon: UserSquare,
  },
  {
    key: 'settings',
    href: '/dashboard/settings',
    icon: Settings,
  },
];

const userMenuItems = [
    {
        key: 'myOrders',
        href: '/dashboard/orders',
        icon: ShoppingBasket,
    },
    {
        key: 'shoppingLists',
        href: '/dashboard/shopping-lists',
        icon: List,
    },
    {
        key: 'wishlist',
        href: '/dashboard/wishlist',
        icon: Heart,
    },
    {
        key: 'profile',
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
  const { t } = useLanguage();

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
                  isActive={pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/dashboard')}
                  tooltip={{ content: t(`dashboard.layout.${item.key}`) }}
                  className={cn(isCollapsed && 'justify-center')}
                >
                  <item.icon />
                  <span className={cn(isCollapsed && 'hidden')}>{t(`dashboard.layout.${item.key}`)}</span>
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
                    <span className={cn(isCollapsed && 'hidden')}>{t('dashboard.layout.logout')}</span>
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

    
