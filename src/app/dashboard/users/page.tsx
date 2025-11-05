'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useLanguage } from '@/hooks/use-language';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useCollection, useFirestore, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, query, doc, setDoc, deleteDoc } from 'firebase/firestore';
import type { User as FirestoreUser } from '@/lib/placeholder-data';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Gem } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

function AdminSwitch({ user, initialIsAdmin }: { user: FirestoreUser, initialIsAdmin: boolean }) {
  const { t } = useLanguage();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [isAdmin, setIsAdmin] = React.useState(initialIsAdmin);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    setIsAdmin(initialIsAdmin);
  }, [initialIsAdmin]);

  const handleAdminChange = (newAdminStatus: boolean) => {
    if (!firestore) return;
    setIsLoading(true);
    
    const adminRoleRef = doc(firestore, 'roles_admin', user.id);

    const operation = newAdminStatus 
      ? setDoc(adminRoleRef, { role: 'admin' }) 
      : deleteDoc(adminRoleRef);

    operation
      .then(() => {
        setIsAdmin(newAdminStatus);
        toast({
          title: t('dashboard.users.role_updated_title'),
          description: t('dashboard.users.role_updated_desc', { userName: user.name, role: newAdminStatus ? 'Admin' : 'User' }),
        });
      })
      .catch(error => {
        const permissionError = new FirestorePermissionError({
            path: adminRoleRef.path,
            operation: newAdminStatus ? 'create' : 'delete',
            requestResourceData: newAdminStatus ? { role: 'admin' } : undefined
        });
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <div className='flex items-center gap-2'>
        <Switch
            checked={isAdmin}
            onCheckedChange={handleAdminChange}
            aria-label={`Toggle admin status for ${user.name}`}
            disabled={isLoading}
        />
        <span>{isAdmin ? <Badge variant="secondary">{t('dashboard.users.admin')}</Badge> : t('dashboard.users.user_role')}</span>
    </div>
  );
}


export default function UsersPage() {
  const { t, locale } = useLanguage();
  const firestore = useFirestore();
  const usersQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'users')) : null, [firestore]);
  const { data: users, isLoading: isLoadingUsers } = useCollection<FirestoreUser>(usersQuery);

  const adminsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'roles_admin')) : null, [firestore]);
  const { data: admins, isLoading: isLoadingAdmins } = useCollection<{ id: string }>(adminsQuery);

  const adminIds = React.useMemo(() => new Set(admins?.map(admin => admin.id) || []), [admins]);

  const isLoading = isLoadingUsers || isLoadingAdmins;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'DZD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="container py-8 md:py-12">
      <Card>
        <CardHeader>
          <CardTitle className='font-headline text-3xl'>{t('dashboard.nav.users')}</CardTitle>
          <CardDescription>{t('dashboard.users.description')}</CardDescription>
        </CardHeader>
        <CardContent>
           <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('dashboard.users.user')}</TableHead>
                  <TableHead>{t('dashboard.users.role')}</TableHead>
                  <TableHead>{t('dashboard.users.registration_date')}</TableHead>
                  <TableHead>{t('dashboard.users.orders')}</TableHead>
                  <TableHead>{t('dashboard.users.total_spent')}</TableHead>
                  <TableHead>{t('dashboard.loyalty.points')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && Array.from({ length: 5 }).map((_, i) => (
                   <TableRow key={i}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  </TableRow>
                ))}
                {users && users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={user.avatar} alt={user.name} />
                          <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="font-medium">
                          <p>{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <AdminSwitch user={user} initialIsAdmin={adminIds.has(user.id)} />
                    </TableCell>
                    <TableCell>{formatDate(user.registrationDate)}</TableCell>
                    <TableCell>{user.orderCount || 0}</TableCell>
                    <TableCell>{formatCurrency(user.totalSpent || 0)}</TableCell>
                    <TableCell>
                        <div className="flex items-center gap-2">
                           <Gem className="h-4 w-4 text-accent" />
                           <span className="font-semibold">{user.loyaltyPoints || 0}</span>
                        </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {!isLoading && users?.length === 0 && (
                <div className="text-center p-8 text-muted-foreground">
                    {t('dashboard.no_users_found')}
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
