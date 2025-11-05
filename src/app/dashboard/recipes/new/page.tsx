'use client';

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
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/hooks/use-language';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { ArrowLeft, Loader2, PlusCircle, Trash2 } from 'lucide-react';
import React from 'react';
import { useFirestore, errorEmitter, FirestorePermissionError } from '@/firebase';
import { addDoc, collection } from 'firebase/firestore';


const formSchema = z.object({
  titleAr: z.string().min(2),
  titleEn: z.string().min(2),
  titleFr: z.string().min(2),
  descriptionAr: z.string().optional(),
  descriptionEn: z.string().optional(),
  descriptionFr: z.string().optional(),
  image: z.string().url(),
  prepTime: z.coerce.number().int().min(0),
  cookTime: z.coerce.number().int().min(0),
  servings: z.coerce.number().int().min(1),
  ingredients: z.array(z.object({ value: z.string().min(1, { message: "Ingredient can't be empty."}) })),
  instructions: z.array(z.object({ value: z.string().min(1, { message: "Instruction can't be empty."}) })),
});

function DynamicFieldArray({ control, name, label, buttonText }: { control: any, name: 'ingredients' | 'instructions', label: string, buttonText: string }) {
    const { fields, append, remove } = useFieldArray({ control, name });
    
    return (
        <div className="space-y-4">
            <FormLabel>{label}</FormLabel>
            {fields.map((field, index) => (
                <div key={field.id} className="flex items-center gap-2">
                    <FormField
                        control={control}
                        name={`${name}.${index}.value`}
                        render={({ field }) => (
                           <FormItem className='flex-grow'>
                             <FormControl>
                                <Input {...field} />
                             </FormControl>
                             <FormMessage />
                           </FormItem>
                        )}
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                </div>
            ))}
            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ value: "" })}
            >
                <PlusCircle className="mr-2 h-4 w-4" />
                {buttonText}
            </Button>
        </div>
    );
}

export default function NewRecipePage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = React.useState(false);
  const firestore = useFirestore();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      titleAr: '', titleEn: '', titleFr: '',
      descriptionAr: '', descriptionEn: '', descriptionFr: '',
      image: 'https://picsum.photos/seed/' + Date.now() + '/1280/720',
      prepTime: 10, cookTime: 20, servings: 4,
      ingredients: [{ value: '' }],
      instructions: [{ value: '' }],
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore) return;
    setIsSaving(true);
    const recipeData = {
        title: { ar: values.titleAr, en: values.titleEn, fr: values.titleFr },
        description: { ar: values.descriptionAr, en: values.descriptionEn, fr: values.descriptionFr },
        image: values.image,
        prepTime: values.prepTime,
        cookTime: values.cookTime,
        servings: values.servings,
        ingredients: values.ingredients.map(i => i.value),
        instructions: values.instructions.map(i => i.value),
    };

    const recipesCollection = collection(firestore, 'recipes');
    addDoc(recipesCollection, recipeData)
      .then(() => {
        toast({ title: t('dashboard.recipes.created_success') });
        form.reset();
      })
      .catch(error => {
        errorEmitter.emit(
            'permission-error',
            new FirestorePermissionError({
                path: recipesCollection.path,
                operation: 'create',
                requestResourceData: recipeData,
            })
        );
      })
      .finally(() => {
        setIsSaving(false);
      });
  }

  return (
    <div className="container py-8 md:py-12">
       <div className="flex items-center gap-4 mb-8">
        <Button asChild variant="outline" size="icon">
          <Link href="/dashboard/recipes">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="font-headline text-3xl md:text-4xl">{t('dashboard.recipes.add_recipe')}</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card>
                <CardHeader><CardTitle>{t('dashboard.recipes.recipe_details')}</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField control={form.control} name="titleAr" render={({ field }) => (
                            <FormItem><FormLabel>{t('dashboard.recipes.title_ar')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="titleEn" render={({ field }) => (
                            <FormItem><FormLabel>{t('dashboard.recipes.title_en')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="titleFr" render={({ field }) => (
                            <FormItem><FormLabel>{t('dashboard.recipes.title_fr')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField control={form.control} name="descriptionAr" render={({ field }) => (
                            <FormItem><FormLabel>{t('dashboard.description_ar')}</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="descriptionEn" render={({ field }) => (
                            <FormItem><FormLabel>{t('dashboard.description_en')}</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="descriptionFr" render={({ field }) => (
                            <FormItem><FormLabel>{t('dashboard.description_fr')}</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                    </div>
                    <FormField control={form.control} name="image" render={({ field }) => (
                        <FormItem><FormLabel>{t('dashboard.recipes.image_url')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField control={form.control} name="prepTime" render={({ field }) => (
                            <FormItem><FormLabel>{t('recipes.prep_time')}</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                         <FormField control={form.control} name="cookTime" render={({ field }) => (
                            <FormItem><FormLabel>{t('recipes.cook_time')}</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                         <FormField control={form.control} name="servings" render={({ field }) => (
                            <FormItem><FormLabel>{t('recipes.servings')}</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                    </div>
                </CardContent>
            </Card>

             <div className="grid md:grid-cols-2 gap-8">
                <Card>
                    <CardHeader><CardTitle>{t('recipes.ingredients')}</CardTitle></CardHeader>
                    <CardContent>
                        <DynamicFieldArray control={form.control} name="ingredients" label={t('recipes.ingredients')} buttonText={t('dashboard.recipes.add_ingredient')} />
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader><CardTitle>{t('recipes.instructions')}</CardTitle></CardHeader>
                    <CardContent>
                        <DynamicFieldArray control={form.control} name="instructions" label={t('recipes.instructions')} buttonText={t('dashboard.recipes.add_instruction')} />
                    </CardContent>
                </Card>
            </div>


          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" asChild>
                <Link href="/dashboard/recipes">{t('dashboard.cancel')}</Link>
            </Button>
            <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('dashboard.save_recipe')}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

    