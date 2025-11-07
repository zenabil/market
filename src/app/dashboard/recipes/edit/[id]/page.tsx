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
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { ArrowLeft, Loader2, PlusCircle, Trash2 } from 'lucide-react';
import React, { useEffect } from 'react';
import { useFirestore, useDoc, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { notFound, useParams, useRouter } from 'next/navigation';
import type { Recipe } from '@/lib/placeholder-data';
import { useUserRole } from '@/hooks/use-user-role';
import { useLanguage } from '@/contexts/language-provider';

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

function EditRecipeForm({ recipeId }: { recipeId: string }) {
  const { t } = useLanguage();
  
  const formSchema = z.object({
    title: z.string().min(2),
    description: z.string().optional(),
    image: z.string().url(),
    prepTime: z.coerce.number().int().min(0),
    cookTime: z.coerce.number().int().min(0),
    servings: z.coerce.number().int().min(1),
    ingredients: z.array(z.object({ value: z.string().min(1, { message: t('dashboard.recipes.validation.ingredient')}) })),
    instructions: z.array(z.object({ value: z.string().min(1, { message: t('dashboard.recipes.validation.instruction')}) })),
  });
  
  const { toast } = useToast();
  const [isSaving, setIsSaving] = React.useState(false);
  const firestore = useFirestore();
  const { isAdmin, isRoleLoading } = useUserRole();
  const router = useRouter();

  const recipeRef = useMemoFirebase(() => doc(firestore, 'recipes', recipeId), [firestore, recipeId]);
  const { data: recipe, isLoading: isLoadingRecipe } = useDoc<Recipe>(recipeRef);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      image: '',
      prepTime: 0, cookTime: 0, servings: 1,
      ingredients: [{ value: '' }],
      instructions: [{ value: '' }],
    },
  });

  const { formState: { isDirty } } = form;

  useEffect(() => {
    if (!isRoleLoading && !isAdmin) {
      router.replace('/dashboard');
    }
  }, [isAdmin, isRoleLoading, router]);

  useEffect(() => {
    if (recipe) {
      form.reset({
        title: recipe.title,
        description: recipe.description,
        image: recipe.image,
        prepTime: recipe.prepTime,
        cookTime: recipe.cookTime,
        servings: recipe.servings,
        ingredients: recipe.ingredients.map(value => ({ value })),
        instructions: recipe.instructions.map(value => ({ value })),
      });
    }
  }, [recipe, form]);
  
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSaving(true);
    const recipeData = {
        title: values.title,
        description: values.description,
        image: values.image,
        prepTime: values.prepTime,
        cookTime: values.cookTime,
        servings: values.servings,
        ingredients: values.ingredients.map(i => i.value),
        instructions: values.instructions.map(i => i.value),
    };

    updateDoc(recipeRef, recipeData)
        .then(() => {
            toast({ title: t('dashboard.recipes.toast.updated') });
            form.reset(values); // Reset the form to the new saved state, clearing isDirty
        })
        .catch(error => {
            errorEmitter.emit(
                'permission-error',
                new FirestorePermissionError({
                    path: recipeRef.path,
                    operation: 'update',
                    requestResourceData: recipeData,
                })
            );
        })
        .finally(() => {
            setIsSaving(false);
        });
  }
  
  const isLoading = isLoadingRecipe || isRoleLoading;

  if (isLoading || !isAdmin) {
    return (
      <div className="container py-8 md:py-12 flex-grow flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!recipe) {
    return notFound();
  }

  return (
    <div className="container py-8 md:py-12">
       <div className="flex items-center gap-4 mb-8">
        <Button asChild variant="outline" size="icon">
          <Link href="/dashboard/recipes">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="font-headline text-3xl md:text-4xl">{t('dashboard.recipes.editPageTitle')}</h1>
      </div>

       <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card>
                <CardHeader><CardTitle>{t('dashboard.recipes.detailsTitle')}</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                    <FormField control={form.control} name="title" render={({ field }) => (
                        <FormItem><FormLabel>{t('dashboard.recipes.title')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="description" render={({ field }) => (
                        <FormItem><FormLabel>{t('dashboard.recipes.description')}</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="image" render={({ field }) => (
                        <FormItem><FormLabel>{t('dashboard.recipes.imageUrl')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField control={form.control} name="prepTime" render={({ field }) => (
                            <FormItem><FormLabel>{t('dashboard.recipes.prepTime')}</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                         <FormField control={form.control} name="cookTime" render={({ field }) => (
                            <FormItem><FormLabel>{t('dashboard.recipes.cookTime')}</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                         <FormField control={form.control} name="servings" render={({ field }) => (
                            <FormItem><FormLabel>{t('dashboard.recipes.servings')}</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                    </div>
                </CardContent>
            </Card>

             <div className="grid md:grid-cols-2 gap-8">
                <Card>
                    <CardHeader><CardTitle>{t('dashboard.recipes.ingredients')}</CardTitle></CardHeader>
                    <CardContent>
                        <DynamicFieldArray control={form.control} name="ingredients" label={t('dashboard.recipes.ingredients')} buttonText={t('dashboard.recipes.addIngredient')} />
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader><CardTitle>{t('dashboard.recipes.instructions')}</CardTitle></CardHeader>
                    <CardContent>
                        <DynamicFieldArray control={form.control} name="instructions" label={t('dashboard.recipes.instructions')} buttonText={t('dashboard.recipes.addInstruction')} />
                    </CardContent>
                </Card>
            </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" asChild>
                <Link href="/dashboard/recipes">{t('dashboard.common.cancel')}</Link>
            </Button>
            <Button type="submit" disabled={isSaving || !isDirty}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('dashboard.common.saveChanges')}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

export default function EditRecipePage({ params }: { params: { id: string } }) {
  return <EditRecipeForm recipeId={params.id} />
}
