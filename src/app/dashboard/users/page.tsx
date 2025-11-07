
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useCollection, useFirestore, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, query, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import type { User as FirestoreUser } from '@/lib/placeholder-data';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Gem, Loader2, Home } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUserRole } from '@/hooks/use-user-role';
import { useRouter } from 'next/navigation';
import { AddressDialog } from '@/components/dashboard/address-dialog';
import { useLanguage } from '@/contexts/language-provider';

function LoyaltyDialog({ user, onPointsUpdate }: { user: FirestoreUser, onPointsUpdate: () => void }) {
  const { t } = useLanguage();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [points, setPoints] = React.useState(user.loyaltyPoints || 0);

  const handleSave = () => {
    if (!firestore || points < 0) return;
    
    setIsSaving(true);
    const userRef = doc(firestore, 'users', user.id);
    const updateData = { loyaltyPoints: Number(points) };

    updateDoc(userRef, updateData)
      .then(() => {
        toast({
          title: t('dashboard.users.toast.loyaltyUpdated.title'),
          description: t('dashboard.users.toast.loyaltyUpdated.description').replace('{{name}}', user.name).replace('{{points}}', points.toString()),
        });
        onPointsUpdate();
        setIsOpen(false);
      })
      .catch(error => {
         errorEmitter.emit(
            'permission-error',
            new FirestorePermissionError({
                path: userRef.path,
                operation: 'update',
                requestResourceData: updateData,
            })
        );
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
            <Gem className="h-4 w-4 text-accent" />
            <span>{user.loyaltyPoints || 0}</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('dashboard.users.loyaltyDialog.title').replace('{{name}}', user.name)}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="loyaltyPoints">{t('dashboard.users.loyaltyDialog.label')}</Label>
          <Input 
            id="loyaltyPoints"
            type="number"
            value={points}
            onChange={(e) => setPoints(Number(e.target.value))}
          />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">{t('dashboard.common.cancel')}</Button>
          </DialogClose>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('dashboard.common.saveChanges')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


function AdminSwitch({ user, onRoleChange }: { user: FirestoreUser, onRoleChange: () => void }) {
  const { t } = useLanguage();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [isAdmin, setIsAdmin] = React.useState(user.role === 'Admin');
  const [isLoading, setIsLoading] = React.useState(false);
  
  React.useEffect(() => {
    setIsAdmin(user.role === 'Admin');
  }, [user.role]);

  const handleAdminChange = (newAdminStatus: boolean) => {
    if (!firestore) return;

    setIsLoading(true);

    const adminRoleRef = doc(firestore, 'roles_admin', user.id);
    const userRef = doc(firestore, 'users', user.id);
    const newRole = newAdminStatus ? 'Admin' : 'User';

    const operation = newAdminStatus 
      ? setDoc(adminRoleRef, { role: 'admin' }) 
      : deleteDoc(adminRoleRef);

    operation
      .then(() => {
        return updateDoc(userRef, { role: newRole });
      })
      .then(() => {
        toast({
          title: t('dashboard.users.toast.roleUpdated.title'),
          description: t('dashboard.users.toast.roleUpdated.description').replace('{{name}}', user.name).replace('{{role}}', newRole),
        });
        onRoleChange();
      })
      .catch(error => {
        const permissionError = new FirestorePermissionError({
            path: newAdminStatus ? adminRoleRef.path : userRef.path,
            operation: newAdminStatus ? 'create' : 'delete', 
            requestResourceData: newAdminStatus ? { role: 'admin' } : { role: 'User' }
        });
        errorEmitter.emit('permission-error', permissionError);
        toast({
          variant: "destructive",
          title: t('dashboard.users.toast.roleError.title'),
          description: t('dashboard.users.toast.roleError.description'),
        });
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
            aria-label={t('dashboard.users.toggleAdminStatus').replace('{{name}}', user.name)}
            disabled={isLoading}
        />
        <span>{isAdmin ? <Badge variant="secondary">{t('dashboard.users.role.admin')}</Badge> : t('dashboard.users.role.user')}</span>
    </div>
  );
}


export default function UsersPage() {
  const { t } = useLanguage();
  const firestore = useFirestore();
  const { isAdmin, isRoleLoading } = useUserRole();
  const router = useRouter();

  const usersQuery = useMemoFirebase(() => {
    if (!firestore || isRoleLoading || !isAdmin) return null;
    return query(collection(firestore, 'users'));
  }, [firestore, isRoleLoading, isAdmin]);

  const { data: users, isLoading: areUsersLoading, refetch } = useCollection<FirestoreUser>(usersQuery);

  React.useEffect(() => {
    if (!isRoleLoading && !isAdmin) {
        router.replace('/dashboard');
    }
  }, [isAdmin, isRoleLoading, router]);

  const handleUpdate = () => {
    refetch();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(t('locale'), {
      style: 'currency',
      currency: 'DZD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString(t('locale'), {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };
  
  const isLoading = isRoleLoading || areUsersLoading;

  if (isLoading || !isAdmin) {
    return (
        <div className="container py-8 md:py-12 flex-grow flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }


  return (
    <div className="container py-8 md:py-12">
      <Card>
        <CardHeader>
          <CardTitle className='font-headline text-3xl'>{t('dashboard.layout.users')}</CardTitle>
          <CardDescription>{t('dashboard.users.description')}</CardDescription>
        </CardHeader>
        <CardContent>
           <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('dashboard.users.user')}</TableHead>
                  <TableHead>{t('dashboard.users.role.title')}</TableHead>
                  <TableHead>{t('dashboard.users.registrationDate')}</TableHead>
                  <TableHead>{t('dashboard.users.totalSpent')}</TableHead>
                  <TableHead className="text-right">{t('dashboard.common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {areUsersLoading && Array.from({ length: 5 }).map((_, i) => (
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
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                  </TableRow>
                ))}
                {!isLoading && users && users.map((user) => (
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
                      <AdminSwitch user={user} onRoleChange={handleUpdate} />
                    </TableCell>
                    <TableCell>{formatDate(user.registrationDate)}</TableCell>
                    <TableCell>{formatCurrency(user.totalSpent || 0)}</TableCell>
                     <TableCell className="text-right">
                       <div className="flex items-center justify-end gap-2">
                        <LoyaltyDialog user={user} onPointsUpdate={handleUpdate} />
                        <AddressDialog 
                          userDocRef={doc(firestore, 'users', user.id)} 
                          firestoreUser={user}
                          onAddressChange={handleUpdate}
                        >
                            <Button variant="ghost" size="icon" title={t('dashboard.users.editAddresses')}>
                                <Home className="h-4 w-4 text-muted-foreground" />
                            </Button>
                        </AddressDialog>
                       </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {!isLoading && users?.length === 0 && (
                <div className="text-center p-8 text-muted-foreground">
                    {t('dashboard.users.noUsers')}
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}

    