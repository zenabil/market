
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
import { useLanguage } from '@/hooks/use-language';
import { useAuth, useUser, useFirestore, errorEmitter, FirestorePermissionError } from '@/firebase';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import Logo from '@/components/icons/logo';
import { Loader2 } from 'lucide-react';
import { doc, setDoc, getDocs, collection, writeBatch, query, limit, updateDoc } from 'firebase/firestore';


const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const signupSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters."}),
  email: z.string().email(),
  password: z.string().min(6),
  confirmPassword: z.string().min(6),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});


export default function LoginPage() {
  const { t } = useLanguage();
  const auth = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const firestore = useFirestore();

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const signupForm = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);
  

  const handleLogin = async (values: z.infer<typeof loginSchema>) => {
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      toast({ title: t('auth.login_success_title') });
      router.push('/dashboard');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: t('auth.error_title'),
        description: error.message,
      });
      // Clear password field on failed login attempt
      loginForm.setValue('password', '');
    } finally {
        setIsLoading(false);
    }
  };

  const handleSignup = async (values: z.infer<typeof signupSchema>) => {
    setIsLoading(true);
    if (!firestore) {
      toast({ variant: 'destructive', title: 'Error', description: 'Firestore not available' });
      setIsLoading(false);
      return;
    }
  
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const newUser = userCredential.user;
  
      if (newUser) {
        const userDocRef = doc(firestore, 'users', newUser.uid);
        const userData = {
          id: newUser.uid,
          name: values.name,
          email: newUser.email,
          role: 'User', // Default role is User
          preferredLanguage: 'ar',
          registrationDate: new Date().toISOString(),
          orderCount: 0,
          totalSpent: 0,
          loyaltyPoints: 0,
          avatar: `https://picsum.photos/seed/${newUser.uid}/100/100`,
          addresses: [],
        };
  
        // Set the main user document first. Security rules allow this for any new user.
        await setDoc(userDocRef, userData);
        
        // Now, attempt to create the admin role. This will only succeed if the user is the first one.
        const adminRoleRef = doc(firestore, 'roles_admin', newUser.uid);
        try {
          await setDoc(adminRoleRef, { role: 'admin' });
          // If the above line succeeds, it means this is the first user. Now, update their user document role.
          await updateDoc(userDocRef, { role: 'Admin' });
        } catch (adminError: any) {
          // This permission error is expected for all users except the first one.
          // We can safely ignore it and let the user continue with the 'User' role.
          if (adminError.code !== 'permission-denied') {
            // Log any other unexpected errors during the admin role setting attempt.
            console.error("An unexpected error occurred while trying to set admin role:", adminError);
          }
        }
      }
  
      toast({ title: t('auth.signup_success_title') });
      router.push('/dashboard');
    } catch (error: any) {
      const permissionError = new FirestorePermissionError({ 
          path: `users/${(error as any).customData?.uid || 'unknown'}`, 
          operation: 'create', 
          requestResourceData: { email: values.email } 
      });

      // Handle primary account creation errors
      if (error.code === 'permission-denied' || error.name === 'FirebaseError') {
        errorEmitter.emit('permission-error', permissionError);
        toast({
            variant: 'destructive',
            title: t('auth.error_title'),
            description: t('auth.signup_profile_error'),
        });
      } else {
          // For other auth errors (like email-already-in-use), show a toast to the user.
          toast({
              variant: 'destructive',
              title: t('auth.error_title'),
              description: error.message,
          });
      }
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className='absolute top-8 left-8'>
            <Link href="/" >
              <Logo className="h-8" />
            </Link>
        </div>
      <Tabs defaultValue="login" className="w-[400px]">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">{t('auth.login')}</TabsTrigger>
          <TabsTrigger value="signup">{t('auth.signup')}</TabsTrigger>
        </TabsList>
        <TabsContent value="login">
          <Card>
            <CardHeader>
              <CardTitle>{t('auth.login_title')}</CardTitle>
              <CardDescription>{t('auth.login_desc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('auth.email')}</FormLabel>
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
                        <FormLabel>{t('auth.password')}</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('auth.login')}
                    </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="signup">
          <Card>
            <CardHeader>
              <CardTitle>{t('auth.signup_title')}</CardTitle>
              <CardDescription>{t('auth.signup_desc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...signupForm}>
                <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-4">
                   <FormField
                    control={signupForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('auth.name')}</FormLabel>
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
                        <FormLabel>{t('auth.email')}</FormLabel>
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
                        <FormLabel>{t('auth.password')}</FormLabel>
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
                        <FormLabel>{t('auth.confirm_password')}</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={isLoading}>
                     {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('auth.signup')}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
