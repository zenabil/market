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
  Gem,
  Settings,
  LogOut,
  ChevronLeft,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/hooks/use-language';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';


const menuItems = [
  {
    key: 'dashboard.nav.overview',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    key: 'dashboard.nav.orders',
    href: '/dashboard/orders',
    icon: ShoppingBasket,
  },
  {
    key: 'dashboard.nav.products',
    href: '/dashboard/products',
    icon: Package,
  },
  {
    key: 'dashboard.nav.users',
    href: '/dashboard/users',
    icon: Users,
  },
  {
    key: 'dashboard.nav.coupons',
    href: '/dashboard/coupons',
    icon: Ticket,
  },
  {
    key: 'dashboard.nav.discounts',
    href: '/dashboard/discounts',
    icon: Percent,
  },
  {
    key: 'dashboard.nav.loyalty',
    href: '/dashboard/loyalty',
    icon: Gem,
  },
  {
    key: 'dashboard.nav.settings',
    href: '/dashboard/settings',
    icon: Settings,
  },
];

function DashboardSidebar() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const { state, open, setOpen } = useSidebar();

  const isCollapsed = state === 'collapsed';

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
              <Link href={item.href} passHref legacyBehavior>
                <SidebarMenuButton
                  isActive={pathname === item.href}
                  tooltip={{ content: t(item.key) }}
                  className={cn(isCollapsed && 'justify-center')}
                >
                  <item.icon />
                  <span className={cn(isCollapsed && 'hidden')}>{t(item.key)}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-2">
        <div className={cn('flex items-center gap-2 p-2 rounded-md bg-muted', isCollapsed && 'justify-center p-0 bg-transparent')}>
           <Avatar className="h-9 w-9">
              <AvatarImage src="https://picsum.photos/seed/admin/100/100" alt="Admin" />
              <AvatarFallback>A</AvatarFallback>
            </Avatar>
            <div className={cn('flex flex-col', isCollapsed && 'hidden')}>
              <span className='text-sm font-semibold'>Admin User</span>
              <span className='text-xs text-muted-foreground'>admin@example.com</span>
            </div>
        </div>
        <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton className={cn(isCollapsed && 'justify-center')}>
                    <LogOut />
                    <span className={cn(isCollapsed && 'hidden')}>{t('dashboard.nav.logout')}</span>
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
