'use client';

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCategories } from '@/hooks/use-categories';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import React, { useEffect } from 'react';
import { useFirestore, errorEmitter, FirestorePermissionError } from '@/firebase';
import { addDoc, collection, updateDoc, doc } from 'firebase/firestore';
import { useUserRole } from '@/hooks/use-user-role';
import { useRouter } from 'next/navigation';
import { generateProductDescription } from '@/ai/flows/generate-product-description';


const formSchema = z.object({
  name: z.string().min(2, { message: 'Le nom doit comporter au moins 2 caractères.' }),
  price: z.coerce.number().positive({ message: 'Le prix doit être un nombre positif.' }),
  stock: z.coerce.number().int().min(0, { message: 'Le stock ne peut pas être négatif.' }),
  categoryId: z.string({ required_error: 'Veuillez sélectionner une catégorie.' }),
});

export default function NewProductPage() {
  const { categories, areCategoriesLoading } = useCategories();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = React.useState(false);
  const firestore = useFirestore();
  const { isAdmin, isRoleLoading } = useUserRole();
  const router = useRouter();

  useEffect(() => {
    if (!isRoleLoading && !isAdmin) {
      router.replace('/dashboard');
    }
  }, [isAdmin, isRoleLoading, router]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      price: 0,
      stock: 0,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore) return;
    setIsSaving(true);
    const productData = {
        ...values,
        description: '',
        discount: 0,
        images: ['https://picsum.photos/seed/' + Date.now() + '/600/600'],
        sku: `SKU-${Date.now()}`,
        barcode: `${Date.now()}`,
        sold: 0,
        averageRating: 0,
        reviewCount: 0,
        createdAt: new Date().toISOString(),
        type: 'standard',
        bundleItems: [],
    };

    try {
        const docRef = await addDoc(collection(firestore, 'products'), productData);
        toast({
            title: 'Produit créé',
            description: `Le produit "${values.name}" a été ajouté. Génération de la description...`,
        });

        // Generate description and then navigate
        const categoryName = categories?.find(c => c.id === values.categoryId)?.name || '';
        const result = await generateProductDescription({
            productName: values.name,
            productCategory: categoryName,
            productDetails: '',
        });

        if (result.description) {
            const productDocRef = doc(firestore, 'products', docRef.id);
            await updateDoc(productDocRef, { description: result.description });
            toast({
                title: 'Description générée!',
                description: `La description pour "${values.name}" a été générée par l'IA.`,
            });
        }
        
        router.push(`/dashboard/products/edit/${docRef.id}`);

    } catch (error) {
        errorEmitter.emit(
            'permission-error',
            new FirestorePermissionError({
                path: collection(firestore, 'products').path,
                operation: 'create',
                requestResourceData: productData,
            })
        );
        toast({
            variant: "destructive",
            title: "Erreur de création",
            description: "Impossible de créer le produit."
        });
    } finally {
        setIsSaving(false);
    }
  }

  if (isRoleLoading || !isAdmin) {
    return (
        <div className="container py-8 md:py-12 flex-grow flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <div className="container py-8 md:py-12">
       <div className="flex items-center gap-4 mb-8">
        <Button asChild variant="outline" size="icon">
          <Link href="/dashboard/products">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="font-headline text-3xl md:text-4xl">Ajouter un nouveau produit</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8" id="new-product-form">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Informations de base</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom du produit</FormLabel>
                      <FormControl>
                        <Input placeholder="Nom du produit" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Catégorie</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={areCategoriesLoading}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={
                              areCategoriesLoading 
                                ? 'Chargement...' 
                                : 'Sélectionnez une catégorie'
                            } />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories?.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prix</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="100.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="stock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="50" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </CardContent>
          </Card>
          <div className="flex justify-end gap-2 max-w-2xl mx-auto">
            <Button type="button" variant="outline" asChild>
                <Link href="/dashboard/products">Annuler</Link>
            </Button>
            <Button type="submit" disabled={isSaving} form='new-product-form'>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Créer et continuer
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
