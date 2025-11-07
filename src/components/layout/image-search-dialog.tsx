'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Camera, Upload, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { diagnosePlant } from '@/ai/flows/diagnose-plant-flow';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function ImageSearchDialog({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSearch = async () => {
    if (!selectedFile || !previewUrl) {
      toast({
        variant: 'destructive',
        title: 'Aucune image sélectionnée',
        description: "Veuillez sélectionner une image à rechercher.",
      });
      return;
    }
    setIsLoading(true);

    try {
      const result = await diagnosePlant({
        photoDataUri: previewUrl,
        description: 'Identify this product',
      });
      
      const productName = result.identification.commonName;

      if (productName && productName.toLowerCase() !== 'unknown') {
        toast({
          title: 'Produit trouvé !',
          description: `Redirection vers les résultats de recherche pour "${productName}".`,
        });
        setIsOpen(false);
        router.push(`/search?q=${encodeURIComponent(productName)}`);
      } else {
        toast({
          variant: 'destructive',
          title: 'Produit non reconnu',
          description: "Nous n'avons pas pu identifier le produit dans l'image. Veuillez essayer une autre image.",
        });
      }
    } catch (error) {
      console.error('Image search error:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur de recherche',
        description: "Une erreur s'est produite lors de la recherche par image.",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Reset state when dialog is closed
  const onOpenChange = (open: boolean) => {
    if (!open) {
        setSelectedFile(null);
        setPreviewUrl(null);
        setIsLoading(false);
    }
    setIsOpen(open);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      {children}
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera /> Recherche par image
          </DialogTitle>
          <DialogDescription>
            Téléchargez une image d'un produit pour le trouver dans notre magasin.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {previewUrl ? (
            <div className="relative aspect-video w-full rounded-md overflow-hidden border">
              <Image src={previewUrl} alt="Aperçu de l'image" fill className="object-contain" />
            </div>
          ) : (
            <div
              className="flex flex-col items-center justify-center h-48 w-full border-2 border-dashed rounded-md cursor-pointer"
              onClick={() => document.getElementById('image-upload-input')?.click()}
            >
              <Upload className="h-8 w-8 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">Cliquez pour télécharger une image</p>
            </div>
          )}
          <Input id="image-upload-input" type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Annuler
          </Button>
          <Button onClick={handleSearch} disabled={!selectedFile || isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Rechercher
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
