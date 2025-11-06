'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth, useUser, useFirestore, errorEmitter, FirestorePermissionError } from '@/firebase';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail, updateProfile } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import Logo from '@/components/icons/logo';
import { Loader2 } from 'lucide-react';
import { doc, setDoc, getDoc, writeBatch } from 'firebase/firestore';
import { useUserRole } from '@/hooks/use-user-role';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger } from '@/components/ui/dialog';
import Image from 'next/image';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const signupSchema = z.object({
  name: z.string().min(2, { message: 'Le nom doit comporter au moins 2 caractères.' }),
  email: z.string().email(),
  password: z.string().min(6),
  confirmPassword: z.string().min(6),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas.',
  path: ["confirmPassword"],
});

const resetPasswordSchema = z.object({
  email: z.string().email({ message: "Veuillez entrer une adresse e-mail valide." }),
});

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px" {...props}>
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
        <path fill="#4CAF50" d="M24,44c5.166,0,9.606-1.977,12.796-5.171l-5.617-4.436C29.208,36.65,26.75,38,24,38c-5.223,0-9.651-3.358-11.28-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l5.617,4.436C39.712,34.556,44,29.62,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
    </svg>
);


export default function LoginPage() {
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const { isAdmin, isRoleLoading } = useUserRole();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const firestore = useFirestore();

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });
  
  const signupForm = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });
  
  const resetPasswordForm = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { email: '' },
  });


  useEffect(() => {
    if (!isUserLoading && user) {
        if (!isRoleLoading) { // Wait for role to be determined
            if (isAdmin) {
                router.replace('/dashboard');
            } else {
                router.replace('/dashboard/orders');
            }
        }
    }
  }, [user, isUserLoading, isAdmin, isRoleLoading, router]);

 const handleCreateUserDocument = async (user: any, name?: string) => {
    if (!firestore) throw new Error("Firestore not available");

    const userDocRef = doc(firestore, "users", user.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      return; // User document already exists
    }

    const displayName = name || user.displayName;

    // First, update the user's profile in Firebase Auth.
    if(displayName && displayName !== user.displayName) {
        await updateProfile(user, { displayName });
    }

    // Base user data for Firestore document
    const userData = {
      id: user.uid,
      name: displayName,
      email: user.email,
      role: 'User', // Default role
      preferredLanguage: "fr",
      registrationDate: new Date().toISOString(),
      orderCount: 0,
      totalSpent: 0,
      loyaltyPoints: 0,
      avatar: user.photoURL || `https://picsum.photos/seed/${user.uid}/100/100`,
      addresses: [],
    };
    
    // Create the user document first. This should always succeed if the user is authenticated.
    await setDoc(userDocRef, userData);

    // After creating the user, attempt to grant admin role.
    // This will only succeed for the very first user due to security rules.
    // We wrap this in a try/catch to handle the expected permission error for subsequent users gracefully.
    try {
        const adminRoleRef = doc(firestore, 'roles_admin', user.uid);
        const batch = writeBatch(firestore);
        batch.set(adminRoleRef, { role: 'admin' });
        batch.update(userDocRef, { role: 'Admin' });
        await batch.commit();
        // If successful, the user is now an admin.
    } catch (error: any) {
        // A permission-denied error is expected for all users except the first one.
        // We can safely ignore it, as the user was already created as a regular 'User'.
        if (error.code !== 'permission-denied') {
          console.error("An unexpected error occurred while attempting to grant admin role:", error);
          // Handle other potential errors (e.g., network issues) if necessary.
        }
    }
  }
  

  const handleLogin = async (values: z.infer<typeof loginSchema>) => {
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      toast({ title: 'Connexion réussie !' });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: "L'email ou le mot de passe est incorrect.",
      });
      loginForm.setValue('password', '');
    } finally {
        setIsLoading(false);
    }
  };

  const handleSignup = async (values: z.infer<typeof signupSchema>) => {
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      await handleCreateUserDocument(userCredential.user, values.name);
      toast({ title: 'Inscription réussie !' });
    } catch (error: any) {
      if (error.code === 'permission-denied' || error.name === 'FirebaseError') {
        const permissionError = new FirestorePermissionError({ 
            path: `users/${(error as any).customData?.uid || 'unknown'}`, 
            operation: 'create', 
            requestResourceData: { email: values.email } 
        });
        errorEmitter.emit('permission-error', permissionError);
      } else {
          toast({
              variant: 'destructive',
              title: 'Erreur',
              description: "Cet email est déjà utilisé.",
          });
      }
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      await handleCreateUserDocument(result.user);
      toast({ title: 'Connexion avec Google réussie !' });
    } catch (error: any) {
        console.error("Google sign-in error:", error);
        toast({
            variant: 'destructive',
            title: 'Erreur de connexion avec Google',
            description: "Une erreur s'est produite. Veuillez réessayer.",
        });
    } finally {
        setIsLoading(false);
    }
  }

  const handlePasswordReset = async (values: z.infer<typeof resetPasswordSchema>) => {
    setIsResettingPassword(true);
    try {
        await sendPasswordResetEmail(auth, values.email);
        toast({
            title: 'Email de réinitialisation envoyé',
            description: 'Veuillez consulter votre boîte de réception pour les instructions.',
        });
    } catch (error: any) {
        console.error("Password reset error:", error);
        toast({
            variant: 'destructive',
            title: 'Erreur',
            description: "Impossible d'envoyer l'e-mail de réinitialisation. Veuillez vérifier l'adresse e-mail.",
        });
    } finally {
        setIsResettingPassword(false);
    }
  }


  if (isUserLoading || isRoleLoading || user) {
    return (
        <div className="w-full min-h-screen flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
       <div className="flex items-center justify-center py-12">
         <div className='absolute top-8 left-8'>
            <Link href="/" >
              <Logo className="h-8" />
            </Link>
        </div>
        <div className="mx-auto grid w-[350px] gap-6">
           <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Connexion</TabsTrigger>
            <TabsTrigger value="signup">Inscription</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
                <Card className="border-none shadow-none">
                    <CardHeader className="px-0">
                    <CardTitle>Connexion</CardTitle>
                    <CardDescription>Connectez-vous à votre compte pour continuer.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                    <div className='space-y-4'>
                        <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isLoading}>
                            <GoogleIcon className="mr-2 h-5 w-5" />
                            Continuer avec Google
                        </Button>

                        <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">
                            Ou continuer avec
                            </span>
                        </div>
                        </div>

                        <Form {...loginForm}>
                        <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                            <FormField
                            control={loginForm.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                    <Input type="email" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                            <FormField
                            control={loginForm.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Mot de passe</FormLabel>
                                <FormControl>
                                    <Input type="password" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                            <div className="text-right text-sm">
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button variant="link" className="p-0 h-auto">Mot de passe oublié?</Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Réinitialiser le mot de passe</DialogTitle>
                                            <DialogDescription>Entrez votre adresse e-mail pour recevoir un lien de réinitialisation.</DialogDescription>
                                        </DialogHeader>
                                        <Form {...resetPasswordForm}>
                                        <form onSubmit={resetPasswordForm.handleSubmit(handlePasswordReset)} className="space-y-4" id="reset-password-form">
                                            <FormField
                                                control={resetPasswordForm.control}
                                                name="email"
                                                render={({ field }) => (
                                                    <FormItem>
                                                    <FormLabel>Email</FormLabel>
                                                    <FormControl><Input type="email" {...field} /></FormControl>
                                                    <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </form>
                                        </Form>
                                        <DialogFooter>
                                            <DialogClose asChild><Button type="button" variant="outline">Annuler</Button></DialogClose>
                                            <Button type="submit" form="reset-password-form" disabled={isResettingPassword}>
                                                {isResettingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                Envoyer l'email
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>
                            <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Se connecter
                            </Button>
                        </form>
                        </Form>
                    </div>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="signup">
                <Card className="border-none shadow-none">
                    <CardHeader className="px-0">
                        <CardTitle>Créer un compte</CardTitle>
                        <CardDescription>Rejoignez-nous dès aujourd'hui !</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                    <div className='space-y-4'>
                        <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isLoading}>
                            <GoogleIcon className="mr-2 h-5 w-5" />
                            Continuer avec Google
                        </Button>

                        <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">
                            Ou créer un compte avec
                            </span>
                        </div>
                        </div>

                        <Form {...signupForm}>
                        <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-4">
                            <FormField
                            control={signupForm.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Nom</FormLabel>
                                <FormControl>
                                    <Input type="text" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                            <FormField
                            control={signupForm.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                    <Input type="email" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                            <FormField
                            control={signupForm.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Mot de passe</FormLabel>
                                <FormControl>
                                    <Input type="password" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                            <FormField control={signupForm.control} name="confirmPassword"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Confirmer le mot de passe</FormLabel>
                                <FormControl>
                                    <Input type="password" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                            <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            S'inscrire
                            </Button>
                        </form>
                        </Form>
                    </div>
                    </CardContent>
                </Card>
            </TabsContent>
            </Tabs>
        </div>
      </div>
      <div className="hidden bg-muted lg:block">
        <Image
          src="https://images.unsplash.com/photo-1588964895597-cf29a1a27a8d?q=80&w=1974&auto=format&fit=crop"
          alt="Image d'une épicerie avec des produits frais"
          width="1920"
          height="1080"
          className="h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  );
}
