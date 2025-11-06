'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCategories } from '@/hooks/use-categories';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { generateProductDescription } from '@/ai/flows/generate-product-description';
import React, { useEffect } from 'react';
import { useFirestore, errorEmitter, FirestorePermissionError } from '@/firebase';
import { addDoc, collection } from 'firebase/firestore';
import { useUserRole } from '@/hooks/use-user-role';
import { useRouter } from 'next/navigation';


const formSchema = z.object({
  name: z.string().min(2, { message: 'Le nom doit comporter au moins 2 caractères.' }),
  description: z.string().optional(),
  price: z.coerce.number().positive({ message: 'Le prix doit être un nombre positif.' }),
  stock: z.coerce.number().int().min(0, { message: 'Le stock ne peut pas être négatif.' }),
  categoryId: z.string({ required_error: 'Veuillez sélectionner une catégorie.' }),
  discount: z.coerce.number().int().min(0).max(100).optional().default(0),
});

export default function NewProductPage() {
  const { categories, areCategoriesLoading } = useCategories();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = React.useState(false);
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
      description: '',
      price: 0,
      stock: 0,
      discount: 0,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore) return;
    setIsSaving(true);
    const productData = {
        name: values.name,
        description: values.description || '',
        price: values.price,
        stock: values.stock,
        categoryId: values.categoryId,
        discount: values.discount,
        images: ['https://picsum.photos/seed/' + Date.now() + '/600/600'], // Placeholder image
        sku: `SKU-${Date.now()}`,
        barcode: `${Date.now()}`,
        sold: 0,
        averageRating: 0,
        reviewCount: 0,
    };

    const productsCollection = collection(firestore, 'products');
    addDoc(productsCollection, productData)
      .then(() => {
        toast({
            title: 'Produit créé',
            description: `Le produit "${values.name}" a été ajouté avec succès.`,
        });
        form.reset({
            name: '',
            description: '',
            price: 0,
            stock: 0,
            discount: 0,
            categoryId: undefined,
        });
      })
      .catch(error => {
        errorEmitter.emit(
            'permission-error',
            new FirestorePermissionError({
                path: productsCollection.path,
                operation: 'create',
                requestResourceData: productData,
            })
        );
      })
      .finally(() => {
        setIsSaving(false);
      });
  }

  const handleGenerateDescription = async () => {
    const { name, categoryId } = form.getValues();
    if (!name || !categoryId) {
      toast({
        variant: 'destructive',
        title: 'Erreur de génération',
        description: 'Veuillez renseigner le nom et la catégorie du produit.',
      });
      return;
    }
    
    setIsGenerating(true);
    try {
      const category = categories?.find(c => c.id === categoryId);
      const result = await generateProductDescription({
        productName: name,
        productCategory: category?.name || '',
        productDetails: '',
      });
      
      if(result.description) form.setValue('description', result.description);

      toast({
        title: 'Description générée avec succès',
      });

    } catch(error) {
      console.error("Failed to generate description:", error);
      toast({
        variant: 'destructive',
        title: 'Échec de la génération',
        description: 'Impossible de générer une description pour le moment.',
      });
    } finally {
      setIsGenerating(false);
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Détails du produit</CardTitle>
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
                  
                  <div className="space-y-2">
                    <div className='flex justify-between items-center'>
                      <h3 className='text-sm font-medium'>Description du produit</h3>
                      <Button type="button" size="sm" variant="outline" onClick={handleGenerateDescription} disabled={isGenerating}>
                        {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isGenerating ? 'Génération...' : 'Générer avec l\'IA'}
                      </Button>
                    </div>
                     <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea placeholder="Description du produit" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Organisation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Tarification & Stock</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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
                    name="discount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Réduction (%)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="10" {...field} />
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
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" asChild>
                <Link href="/dashboard/products">Annuler</Link>
            </Button>
            <Button type="submit" disabled={isSaving} form='new-product-form'>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enregistrer le produit
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
