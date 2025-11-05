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
import { useLanguage } from '@/hooks/use-language';
import { getCategories } from '@/lib/placeholder-data';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { generateProductDescription } from '@/ai/flows/generate-product-description';
import React from 'react';

const formSchema = z.object({
  nameAr: z.string().min(2, { message: 'Arabic name must be at least 2 characters.' }),
  nameEn: z.string().min(2, { message: 'English name must be at least 2 characters.' }),
  nameFr: z.string().min(2, { message: 'French name must be at least 2 characters.' }),
  descriptionAr: z.string().optional(),
  descriptionEn: z.string().optional(),
  descriptionFr: z.string().optional(),
  price: z.coerce.number().positive({ message: 'Price must be a positive number.' }),
  stock: z.coerce.number().int().min(0, { message: 'Stock cannot be negative.' }),
  categoryId: z.string({ required_error: 'Please select a category.' }),
  discount: z.coerce.number().int().min(0).max(100).optional().default(0),
});

export default function NewProductPage() {
  const { t, locale } = useLanguage();
  const categories = getCategories();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = React.useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nameAr: '',
      nameEn: '',
      nameFr: '',
      price: 0,
      stock: 0,
      discount: 0,
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
    toast({
      title: t('dashboard.product_created_success'),
      description: t('dashboard.product_created_desc', { productName: values.nameEn }),
    });
  }

  const handleGenerateDescription = async () => {
    const { nameAr, nameEn, nameFr, categoryId } = form.getValues();
    if (!nameAr || !nameEn || !nameFr || !categoryId) {
      toast({
        variant: 'destructive',
        title: t('dashboard.generation_error_title'),
        description: t('dashboard.generation_error_desc'),
      });
      return;
    }
    
    setIsGenerating(true);
    try {
      const category = categories.find(c => c.id === categoryId);
      const result = await generateProductDescription({
        productNameAr: nameAr,
        productNameEn: nameEn,
        productNameFr: nameFr,
        productCategory: category?.name[locale] || '',
        productDetails: '',
      });
      
      if(result.descriptionAr) form.setValue('descriptionAr', result.descriptionAr);
      if(result.descriptionEn) form.setValue('descriptionEn', result.descriptionEn);
      if(result.descriptionFr) form.setValue('descriptionFr', result.descriptionFr);

      toast({
        title: t('dashboard.description_generated_success'),
      });

    } catch(error) {
      console.error("Failed to generate description:", error);
      toast({
        variant: 'destructive',
        title: t('dashboard.generation_failed_title'),
        description: t('dashboard.generation_failed_desc'),
      });
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="container py-8 md:py-12">
       <div className="flex items-center gap-4 mb-8">
        <Button asChild variant="outline" size="icon">
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="font-headline text-3xl md:text-4xl">{t('dashboard.add_new_product')}</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>{t('dashboard.product_details')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="nameAr"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('dashboard.product_name_ar')}</FormLabel>
                          <FormControl>
                            <Input placeholder={t('dashboard.product_name_placeholder')} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="nameEn"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('dashboard.product_name_en')}</FormLabel>
                          <FormControl>
                            <Input placeholder={t('dashboard.product_name_placeholder')} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="nameFr"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('dashboard.product_name_fr')}</FormLabel>
                          <FormControl>
                            <Input placeholder={t('dashboard.product_name_placeholder')} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className='flex justify-between items-center'>
                      <h3 className='text-sm font-medium'>{t('dashboard.product_description')}</h3>
                      <Button type="button" size="sm" variant="outline" onClick={handleGenerateDescription} disabled={isGenerating}>
                        {isGenerating ? t('dashboard.generating_description') : t('dashboard.generate_with_ai')}
                      </Button>
                    </div>
                     <FormField
                      control={form.control}
                      name="descriptionAr"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-muted-foreground">{t('dashboard.description_ar')}</FormLabel>
                          <FormControl>
                            <Textarea placeholder={t('dashboard.description_placeholder')} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={form.control}
                      name="descriptionEn"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-muted-foreground">{t('dashboard.description_en')}</FormLabel>
                          <FormControl>
                            <Textarea placeholder={t('dashboard.description_placeholder')} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={form.control}
                      name="descriptionFr"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-muted-foreground">{t('dashboard.description_fr')}</FormLabel>
                          <FormControl>
                            <Textarea placeholder={t('dashboard.description_placeholder')} {...field} />
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
                  <CardTitle>{t('dashboard.organization')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('dashboard.category')}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('dashboard.select_category_placeholder')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name[locale]}
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
                  <CardTitle>{t('dashboard.pricing_stock')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                   <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('dashboard.price')}</FormLabel>
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
                        <FormLabel>{t('dashboard.discount_percentage')}</FormLabel>
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
                        <FormLabel>{t('dashboard.stock')}</FormLabel>
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
            <Button type="button" variant="outline">{t('dashboard.cancel')}</Button>
            <Button type="submit">{t('dashboard.save_product')}</Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

    