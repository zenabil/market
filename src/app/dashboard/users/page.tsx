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
import { Gem, Edit, Loader2 } from 'lucide-react';
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

function LoyaltyDialog({ user }: { user: FirestoreUser }) {
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
          title: 'Points de fidélité mis à jour',
          description: `${user.name} a maintenant ${points} points.`,
        });
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
        <Button variant="ghost" size="icon">
          <Edit className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{`Modifier les points de fidélité de ${user.name}`}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="loyaltyPoints">Points de fidélité</Label>
          <Input 
            id="loyaltyPoints"
            type="number"
            value={points}
            onChange={(e) => setPoints(Number(e.target.value))}
          />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">Annuler</Button>
          </DialogClose>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enregistrer les modifications
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


function AdminSwitch({ user }: { user: FirestoreUser }) {
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
    setIsAdmin(newAdminStatus); 

    const adminRoleRef = doc(firestore, 'roles_admin', user.id);
    const userRef = doc(firestore, 'users', user.id);

    const operation = newAdminStatus 
      ? setDoc(adminRoleRef, { role: 'admin' }) 
      : deleteDoc(adminRoleRef);

    operation
      .then(() => {
        return updateDoc(userRef, { role: newAdminStatus ? 'Admin' : 'User' });
      })
      .then(() => {
        toast({
          title: 'Rôle mis à jour',
          description: `${user.name} est maintenant ${newAdminStatus ? 'Admin' : 'Utilisateur'}.`,
        });
      })
      .catch(error => {
        setIsAdmin(!newAdminStatus); 
        const permissionError = new FirestorePermissionError({
            path: newAdminStatus ? adminRoleRef.path : userRef.path,
            operation: newAdminStatus ? 'create' : 'delete', 
            requestResourceData: newAdminStatus ? { role: 'admin' } : { role: 'User' }
        });
        errorEmitter.emit('permission-error', permissionError);
        toast({
          variant: "destructive",
          title: "Échec de la mise à jour du rôle",
          description: "Vous n'avez peut-être pas la permission d'effectuer cette action.",
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
            aria-label={`Toggle admin status for ${user.name}`}
            disabled={isLoading}
        />
        <span>{isAdmin ? <Badge variant="secondary">Admin</Badge> : 'Utilisateur'}</span>
    </div>
  );
}


export default function UsersPage() {
  const firestore = useFirestore();
  const { isAdmin, isRoleLoading } = useUserRole();

  // Only attempt to query users if the current user is an admin.
  const usersQuery = useMemoFirebase(() => {
    if (!firestore || isRoleLoading || !isAdmin) return null;
    return query(collection(firestore, 'users'));
  }, [firestore, isRoleLoading, isAdmin]);

  const { data: users, isLoading: areUsersLoading } = useCollection<FirestoreUser>(usersQuery);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'DZD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };
  
  const isLoading = isRoleLoading || areUsersLoading;

  return (
    <div className="container py-8 md:py-12">
      <Card>
        <CardHeader>
          <CardTitle className='font-headline text-3xl'>Utilisateurs</CardTitle>
          <CardDescription>Gérez les utilisateurs et leurs permissions.</CardDescription>
        </CardHeader>
        <CardContent>
           <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Date d'inscription</TableHead>
                  <TableHead>Commandes</TableHead>
                  <TableHead>Total dépensé</TableHead>
                  <TableHead>Points de fidélité</TableHead>
                   <TableHead className="text-right">Actions</TableHead>
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
                    <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
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
                      <AdminSwitch user={user} />
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
                     <TableCell className="text-right">
                      <LoyaltyDialog user={user} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {!isLoading && users?.length === 0 && (
                <div className="text-center p-8 text-muted-foreground">
                    Aucun utilisateur trouvé.
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
