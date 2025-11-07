
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useFirestore, useDoc, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserRole } from '@/hooks/use-user-role';
import { useRouter } from 'next/navigation';
import { Loader2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type PageContent = {
    id: string;
    title_fr: string;
    content_fr: string;
    title_ar: string;
    content_ar: string;
};

const pageIds = ['about', 'privacy', 'terms'];
const pageTitles: { [key: string]: string } = {
    about: 'À Propos',
    privacy: 'Politique de Confidentialité',
    terms: 'Conditions d\'Utilisation',
};

function ContentEditor({ pageId }: { pageId: string }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    
    const pageContentRef = useMemoFirebase(() => doc(firestore, 'pageContent', pageId), [firestore, pageId]);
    const { data: pageContent, isLoading } = useDoc<PageContent>(pageContentRef);

    const [content, setContent] = useState<Omit<PageContent, 'id'>>({
        title_fr: '', content_fr: '', title_ar: '', content_ar: ''
    });

    useEffect(() => {
        if (pageContent) {
            setContent(pageContent);
        }
    }, [pageContent]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await setDoc(pageContentRef, content, { merge: true });
            toast({ title: "Contenu sauvegardé", description: `La page '${pageTitles[pageId]}' a été mise à jour.` });
        } catch (error) {
            errorEmitter.emit(
                'permission-error',
                new FirestorePermissionError({
                    path: pageContentRef.path,
                    operation: 'update',
                    requestResourceData: content,
                })
            );
            toast({ variant: 'destructive', title: "Erreur de sauvegarde" });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <Skeleton className="h-96 w-full" />;
    }

    return (
        <Card>
            <CardHeader className="flex-row items-center justify-between">
                <CardTitle>{pageTitles[pageId]}</CardTitle>
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Enregistrer
                </Button>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="fr">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="fr">Français</TabsTrigger>
                        <TabsTrigger value="ar">Arabe</TabsTrigger>
                    </TabsList>
                    <TabsContent value="fr" className="space-y-4 pt-4">
                         <div className="space-y-2">
                            <Label htmlFor={`title_fr_${pageId}`}>Titre (FR)</Label>
                            <Input 
                                id={`title_fr_${pageId}`}
                                value={content.title_fr} 
                                onChange={e => setContent(c => ({...c, title_fr: e.target.value}))}
                             />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor={`content_fr_${pageId}`}>Contenu (FR)</Label>
                            <Textarea 
                                id={`content_fr_${pageId}`}
                                value={content.content_fr} 
                                onChange={e => setContent(c => ({...c, content_fr: e.target.value}))}
                                rows={15}
                            />
                        </div>
                    </TabsContent>
                    <TabsContent value="ar" className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor={`title_ar_${pageId}`}>Titre (AR)</Label>
                            <Input 
                                id={`title_ar_${pageId}`}
                                value={content.title_ar} 
                                onChange={e => setContent(c => ({...c, title_ar: e.target.value}))}
                                dir="rtl"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor={`content_ar_${pageId}`}>Contenu (AR)</Label>
                            <Textarea 
                                id={`content_ar_${pageId}`}
                                value={content.content_ar} 
                                onChange={e => setContent(c => ({...c, content_ar: e.target.value}))}
                                rows={15}
                                dir="rtl"
                            />
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}


export default function ContentManagementPage() {
  const { isAdmin, isRoleLoading } = useUserRole();
  const router = useRouter();
  
  useEffect(() => {
      if (!isRoleLoading && !isAdmin) {
          router.replace('/dashboard');
      }
  }, [isAdmin, isRoleLoading, router]);

  if (isRoleLoading || !isAdmin) {
      return (
          <div className="container py-8 md:py-12 flex-grow flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
      );
  }

  return (
    <div className="container py-8 md:py-12">
        <div className="mb-8">
            <h1 className='font-headline text-3xl'>Gestion de Contenu</h1>
            <p className="text-muted-foreground">Modifiez le contenu des pages statiques de votre site.</p>
        </div>
        
        <div className="space-y-8">
            {pageIds.map(pageId => (
                <ContentEditor key={pageId} pageId={pageId} />
            ))}
        </div>
    </div>
  );
}


    