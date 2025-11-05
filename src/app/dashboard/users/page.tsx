'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/hooks/use-language';
import { getUsers } from '@/lib/placeholder-data';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function UsersPage() {
  const { t, locale } = useLanguage();
  const users = getUsers();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'DZD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
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
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={user.avatar} alt={user.name} />
                          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="font-medium">
                          <p>{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(user.registrationDate)}</TableCell>
                    <TableCell>{user.orderCount}</TableCell>
                    <TableCell>{formatCurrency(user.totalSpent)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
}
