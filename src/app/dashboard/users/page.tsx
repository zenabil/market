
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/hooks/use-language';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { User as FirestoreUser } from '@/lib/placeholder-data';
import { Skeleton } from '@/components/ui/skeleton';

export default function UsersPage() {
  const { t, locale } = useLanguage();
  const firestore = useFirestore();
  const usersQuery = useMemoFirebase(() => query(collection(firestore, 'users')), [firestore]);
  const { data: users, isLoading } = useCollection<FirestoreUser>(usersQuery);

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
          <CardTitle>{t('dashboard.nav.users')}</CardTitle>
        </CardHeader>
        <CardContent>
           <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('dashboard.users.user')}</TableHead>
                  <TableHead>{t('dashboard.users.registration_date')}</TableHead>
                  <TableHead>{t('dashboard.users.orders')}</TableHead>
                  <TableHead>{t('dashboard.users.total_spent')}</TableHead>
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
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
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
                    <TableCell>{formatDate(user.registrationDate)}</TableCell>
                    <TableCell>{user.orderCount || 0}</TableCell>
                    <TableCell>{formatCurrency(user.totalSpent || 0)}</TableCell>
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
