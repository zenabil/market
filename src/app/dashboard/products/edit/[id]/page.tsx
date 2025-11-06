'use client';

import React, { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
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
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCategories } from '@/hooks/use-categories';
import type { Product } from '@/lib/placeholder-data';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { ArrowLeft, Loader2, PlusCircle, Trash2, ImageIcon, Star } from 'lucide-react';
import { generateProductDescription } from '@/ai/flows/generate-product-description';
import { useFirestore, useDoc, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { notFound, useRouter } from 'next/navigation';
import { useUserRole } from '@/hooks/use-user-role';
import Image from 'next/image';
import { ImageDialog } from '@/components/dashboard/image-dialog';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Le nom doit comporter au moins 2 caractères.' }),
  description: z.string().optional(),
  price: z.coerce.number().positive({ message: 'Le prix doit être un nombre positif.' }),
  stock: z.coerce.number().int().min(0, { message: 'Le stock ne peut pas être négatif.' }),
  categoryId: z.string({ required_error: 'Veuillez sélectionner une catégorie.' }),
  discount: z.coerce.number().int().min(0).max(100).optional().default(0),
  images: z.array(z.string().url({ message: 'URL invalide.' })).min(1, { message: 'Au moins une image est requise.'}),
});

function EditProductForm({ productId }: { productId: string }) {
  const { categories, areCategoriesLoading } = useCategories();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const firestore = useFirestore();
  const { isAdmin, isRoleLoading } = useUserRole();
  const router = useRouter();

  const productRef = useMemoFirebase(() => doc(firestore, 'products', productId), [firestore, productId]);
  const { data: product, isLoading: isLoadingProduct } = useDoc<Product>(productRef);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  const { fields, append, remove, move } = useFieldArray({
      control: form.control,
      name: "images"
  });

  useEffect(() => {
    if (!isRoleLoading && !isAdmin) {
      router.replace('/dashboard');
    }
  }, [isAdmin, isRoleLoading, router]);

  useEffect(() => {
    if (product) {
      form.reset({
        name: product.name,
        description: product.description,
        price: product.price,
        stock: product.stock,
        categoryId: product.categoryId,
        discount: product.discount,
        images: product.images,
      });
    }
  }, [product, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!product) return;
    setIsSaving(true);
    const productData = {
        ...product,
        ...values
    };
    
    const { id, ...dataToUpdate } = productData;

    updateDoc(productRef, dataToUpdate)
        .then(() => {
            toast({
                title: 'Produit mis à jour',
                description: `Le produit "${values.name}" a été mis à jour avec succès.`,
            });
        })
        .catch(error => {
            errorEmitter.emit(
                'permission-error',
                new FirestorePermissionError({
                    path: productRef.path,
                    operation: 'update',
                    requestResourceData: dataToUpdate,
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

  const handleSetPrimaryImage = (index: number) => {
    if (index > 0) {
      move(index, 0);
      toast({ title: "Image principale mise à jour" });
    }
  };

  const isLoading = isLoadingProduct || areCategoriesLoading || isRoleLoading;
  
  if (isLoading || !isAdmin) {
    return (
        <div className="container py-8 md:py-12 flex-grow flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  if (!product) {
    return notFound();
  }

  return (
    <div className="container py-8 md:py-12">
       <div className="flex items-center gap-4 mb-8">
        <Button asChild variant="outline" size="icon">
          <Link href="/dashboard/products">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="font-headline text-3xl md:text-4xl">Modifier le produit</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
                      <Button type="button" size="sm" variant="outline" onClick={handleGenerateDescription} disabled={isGenerating || !form.watch('name') || !form.watch('categoryId')}>
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

              <Card>
                <CardHeader><CardTitle>Images</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    {fields.length > 0 && (
                        <div className="relative group aspect-square max-w-sm">
                            <Image src={form.watch('images.0')} alt="Primary image" layout="fill" className="object-cover rounded-md border" />
                            <div className='absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center'>
                                <span className='text-white font-bold bg-black/50 px-2 py-1 rounded-sm'>Image principale</span>
                            </div>
                        </div>
                    )}
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                    {fields.slice(1).map((field, index) => (
                      <div key={field.id} className="relative group aspect-square">
                        <Image src={form.watch(`images.${index + 1}`)} alt={`Aperçu ${index + 1}`} layout="fill" className="object-cover rounded-md border" />
                        <div className='absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1'>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-white hover:bg-white/20"
                                onClick={() => handleSetPrimaryImage(index + 1)}
                                title="Définir comme image principale"
                            >
                                <Star className="h-5 w-5" />
                            </Button>
                             <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-white hover:bg-white/20 hover:text-destructive"
                                onClick={() => remove(index + 1)}
                                title="Supprimer l'image"
                            >
                                <Trash2 className="h-5 w-5" />
                            </Button>
                        </div>
                      </div>
                    ))}
                    <ImageDialog onImageAdd={(url) => append(url)}>
                      <button
                        type="button"
                        className="aspect-square flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-md hover:bg-muted hover:border-solid"
                      >
                        <PlusCircle className="h-8 w-8" />
                        <span className="text-xs mt-2">Ajouter</span>
                      </button>
                    </ImageDialog>
                  </div>
                   {form.formState.errors.images && <p className="text-sm text-destructive">{form.formState.errors.images.message}</p>}
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
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionnez une catégorie" />
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
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enregistrer les modifications
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}


export default function EditProductPage({ params }: { params: { id: string } }) {
  return <EditProductForm productId={params.id} />
}
