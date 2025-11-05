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
import React from 'react';
import { useFirestore, errorEmitter, FirestorePermissionError } from '@/firebase';
import { addDoc, collection } from 'firebase/firestore';


const formSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  image: z.string().url(),
  prepTime: z.coerce.number().int().min(0),
  cookTime: z.coerce.number().int().min(0),
  servings: z.coerce.number().int().min(1),
  ingredients: z.array(z.object({ value: z.string().min(1, { message: "L'ingrédient ne peut pas être vide."}) })),
  instructions: z.array(z.object({ value: z.string().min(1, { message: "L'instruction ne peut pas être vide."}) })),
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
  const { toast } = useToast();
  const [isSaving, setIsSaving] = React.useState(false);
  const firestore = useFirestore();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
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
        title: values.title,
        description: values.description,
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
        toast({ title: 'Recette créée' });
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
        <h1 className="font-headline text-3xl md:text-4xl">Ajouter une nouvelle recette</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card>
                <CardHeader><CardTitle>Détails de la recette</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                    <FormField control={form.control} name="title" render={({ field }) => (
                        <FormItem><FormLabel>Titre</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="description" render={({ field }) => (
                        <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="image" render={({ field }) => (
                        <FormItem><FormLabel>URL de l'image</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField control={form.control} name="prepTime" render={({ field }) => (
                            <FormItem><FormLabel>Temps de préparation (min)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                         <FormField control={form.control} name="cookTime" render={({ field }) => (
                            <FormItem><FormLabel>Temps de cuisson (min)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                         <FormField control={form.control} name="servings" render={({ field }) => (
                            <FormItem><FormLabel>Portions</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                    </div>
                </CardContent>
            </Card>

             <div className="grid md:grid-cols-2 gap-8">
                <Card>
                    <CardHeader><CardTitle>Ingrédients</CardTitle></CardHeader>
                    <CardContent>
                        <DynamicFieldArray control={form.control} name="ingredients" label="Ingrédients" buttonText="Ajouter un ingrédient" />
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader><CardTitle>Instructions</CardTitle></CardHeader>
                    <CardContent>
                        <DynamicFieldArray control={form.control} name="instructions" label="Instructions" buttonText="Ajouter une instruction" />
                    </CardContent>
                </Card>
            </div>


          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" asChild>
                <Link href="/dashboard/recipes">Annuler</Link>
            </Button>
            <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enregistrer la recette
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
