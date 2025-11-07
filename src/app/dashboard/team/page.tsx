'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, MoreHorizontal, Trash2, Edit, Loader2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useFirestore, errorEmitter, FirestorePermissionError, useUser } from '@/firebase';
import { doc, addDoc, updateDoc, deleteDoc, collection, query } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Image from 'next/image';
import { useCollection, useMemoFirebase } from '@/firebase';
import type { TeamMember } from '@/lib/placeholder-data';
import { useUserRole } from '@/hooks/use-user-role';
import { useRouter } from 'next/navigation';


const teamMemberFormSchema = z.object({
  name: z.string().min(2, { message: 'Le nom est requis.' }),
  role: z.string().min(2, { message: 'Le rôle est requis.' }),
  avatar: z.string().url({ message: 'Veuillez entrer une URL d\'image valide.' }),
});

function TeamMemberDialog({ member, onActionComplete }: { member?: TeamMember | null, onActionComplete: () => void }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof teamMemberFormSchema>>({
    resolver: zodResolver(teamMemberFormSchema),
    defaultValues: {
      name: '',
      role: '',
      avatar: '',
    },
  });

  React.useEffect(() => {
    if (isOpen) {
        if (member) {
          form.reset({
            name: member.name,
            role: member.role,
            avatar: member.avatar,
          });
        } else {
          form.reset({
            name: '',
            role: '',
            avatar: `https://picsum.photos/seed/${Date.now()}/200/200`,
          });
        }
    }
  }, [member, form, isOpen]);

  async function onSubmit(values: z.infer<typeof teamMemberFormSchema>) {
    if (!firestore) return;

    setIsSaving(true);
    
    const actionPromise = member 
        ? updateDoc(doc(firestore, 'teamMembers', member.id), values)
        : addDoc(collection(firestore, 'teamMembers'), values);

    actionPromise
      .then(() => {
          toast({ title: member ? 'Membre mis à jour' : 'Membre ajouté' });
          setIsOpen(false);
          onActionComplete();
      })
      .catch(error => {
          const path = member ? `teamMembers/${member.id}` : 'teamMembers';
          errorEmitter.emit(
            'permission-error',
            new FirestorePermissionError({
              path: path,
              operation: member ? 'update' : 'create',
              requestResourceData: values,
            })
          );
      })
      .finally(() => {
          setIsSaving(false);
      });
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {member ? (
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <Edit className="mr-2 h-4 w-4" />
                Modifier
            </DropdownMenuItem>
        ) : (
             <Button size="sm" className="gap-1">
                <PlusCircle className="h-4 w-4" />
                Ajouter un membre
             </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{member ? 'Modifier le membre' : 'Ajouter un nouveau membre'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" id={`team-member-dialog-form-${member?.id || 'new'}`}>
          <div className="space-y-2">
            <Label>Nom</Label>
            <Input {...form.register('name')} />
            {form.formState.errors.name && <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>}
          </div>
           <div className="space-y-2">
            <Label>Rôle</Label>
            <Input {...form.register('role')} />
            {form.formState.errors.role && <p className="text-sm text-destructive">{form.formState.errors.role.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>URL de l'avatar</Label>
            <Input {...form.register('avatar')} />
            {form.formState.errors.avatar && <p className="text-sm text-destructive">{form.formState.errors.avatar.message}</p>}
          </div>
        </form>
           <DialogFooter>
             <DialogClose asChild>
              <Button type="button" variant="outline">Annuler</Button>
             </DialogClose>
            <Button type="submit" disabled={isSaving} form={`team-member-dialog-form-${member?.id || 'new'}`}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enregistrer
            </Button>
          </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


export default function TeamPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const teamQuery = useMemoFirebase(() => query(collection(firestore, 'teamMembers')), [firestore]);
  const { data: teamMembers, isLoading: areMembersLoading, refetch } = useCollection<TeamMember>(teamQuery);
  const [memberToDelete, setMemberToDelete] = React.useState<TeamMember | null>(null);
  const [isAlertOpen, setIsAlertOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const { isAdmin, isRoleLoading } = useUserRole();
  const router = useRouter();
  
  React.useEffect(() => {
      if (!isRoleLoading && !isAdmin) {
          router.replace('/dashboard');
      }
  }, [isAdmin, isRoleLoading, router]);

  const handleDeleteMember = async () => {
    if (!memberToDelete || !firestore) return;
    
    setIsDeleting(true);

    const memberDocRef = doc(firestore, 'teamMembers', memberToDelete.id);
    
    try {
      await deleteDoc(memberDocRef);
      refetch();
      toast({ title: 'Membre supprimé' });
    } catch (error) {
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: memberDocRef.path,
          operation: 'delete',
        })
      );
      toast({
        variant: 'destructive',
        title: 'Erreur de suppression',
        description: "Vous n'avez peut-être pas la permission de faire cela.",
      });
    } finally {
      setIsDeleting(false);
      setMemberToDelete(null);
      setIsAlertOpen(false);
    }
  };
  
  const openDeleteDialog = (member: TeamMember) => {
    setMemberToDelete(member);
    setIsAlertOpen(true);
  }
  
  const isLoading = areMembersLoading || isRoleLoading;

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
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
            <CardTitle>Équipe</CardTitle>
            <CardDescription>Gérez les membres de l'équipe affichés sur la page "À propos".</CardDescription>
            </div>
            <TeamMemberDialog onActionComplete={refetch} />
        </CardHeader>
        <CardContent>
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Avatar</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {areMembersLoading && Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                    <TableCell><Skeleton className="h-10 w-10 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                </TableRow>
                ))}
                {teamMembers && teamMembers.map(member => (
                <TableRow key={member.id}>
                    <TableCell>
                        <Image src={member.avatar} alt={member.name} width={40} height={40} className="rounded-full object-cover" />
                    </TableCell>
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell>{member.role}</TableCell>
                    <TableCell className="text-right">
                        <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Ouvrir le menu</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <TeamMemberDialog member={member} onActionComplete={refetch} />
                            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); openDeleteDialog(member);}} className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Supprimer
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                </TableRow>
                ))}
            </TableBody>
            </Table>
            {!areMembersLoading && teamMembers?.length === 0 && (
            <div className="text-center p-8 text-muted-foreground">
                Aucun membre d'équipe trouvé.
            </div>
            )}
        </CardContent>
        </Card>
        
        <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Êtes-vous sûr de vouloir supprimer ?</AlertDialogTitle>
                <AlertDialogDescription>
                    Cette action ne peut pas être annulée. Cela supprimera définitivement le membre de l'équipe "{memberToDelete?.name || ''}".
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setMemberToDelete(null)}>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteMember} disabled={isDeleting}>
                    {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Supprimer
                </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
