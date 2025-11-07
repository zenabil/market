
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
import { useLanguage } from '@/contexts/language-provider';


export default function NewProductPage() {
  const { t } = useLanguage();
  
  const formSchema = z.object({
    name: z.string().min(2, { message: t('dashboard.products.validation.name') }),
    purchasePrice: z.coerce.number().min(0, { message: t('dashboard.products.validation.priceNegative') }),
    price: z.coerce.number().positive({ message: t('dashboard.products.validation.pricePositive') }),
    stock: z.coerce.number().int().min(0, { message: t('dashboard.products.validation.stock') }),
    categoryId: z.string({ required_error: t('dashboard.products.validation.category') }),
  });
  
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
      purchasePrice: 0,
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
            title: t('dashboard.products.toastCreate.title'),
            description: t('dashboard.products.toastCreate.description').replace('{{name}}', values.name),
        });

        // Redirect immediately
        router.push(`/dashboard/products/edit/${docRef.id}`);

        // Generate description in the background
        const categoryName = categories?.find(c => c.id === values.categoryId)?.name || '';
        generateProductDescription({
            productName: values.name,
            productCategory: categoryName,
            productDetails: '',
        }).then(result => {
             if (result.description) {
                const productDocRef = doc(firestore, 'products', docRef.id);
                updateDoc(productDocRef, { description: result.description });
                // Optional: show a success toast for generation
                 toast({
                    title: t('dashboard.products.toastGenerateDesc.title'),
                    description: t('dashboard.products.toastGenerateDesc.description').replace('{{name}}', values.name),
                });
            }
        }).catch(error => {
            console.error("Failed to generate description:", error);
            // Don't bother the user if they've already navigated away
        });

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
            title: t('dashboard.common.error'),
            description: t('dashboard.common.permissionError')
        });
        setIsSaving(false); // Only set saving to false on error
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
        <h1 className="font-headline text-3xl md:text-4xl">{t('dashboard.products.newPageTitle')}</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8" id="new-product-form">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>{t('dashboard.products.basicInfoTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('dashboard.products.productName')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('dashboard.products.productNamePlaceholder')} {...field} />
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
                      <FormLabel>{t('dashboard.products.category')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={areCategoriesLoading}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={
                              areCategoriesLoading 
                                ? t('dashboard.common.loading')
                                : t('dashboard.products.selectCategory')
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
                  name="purchasePrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('dashboard.products.purchasePrice')}</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="80.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('dashboard.products.sellingPrice')}</FormLabel>
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
                      <FormLabel>{t('dashboard.products.stock')}</FormLabel>
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
                <Link href="/dashboard/products">{t('dashboard.products.cancel')}</Link>
            </Button>
            <Button type="submit" disabled={isSaving} form='new-product-form'>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('dashboard.products.createAndContinue')}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

    

    