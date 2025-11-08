
'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Camera, Upload, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { identifyProduct } from '@/ai/flows/identify-product-flow';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useLanguage } from '@/contexts/language-provider';

export default function ImageSearchDialog({ children }: { children: React.ReactNode }) {
  const { t } = useLanguage();
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
        title: t('imageSearch.noImage.title'),
        description: t('imageSearch.noImage.description'),
      });
      return;
    }
    setIsLoading(true);

    try {
      const result = await identifyProduct({
        photoDataUri: previewUrl,
        description: 'Identify this product',
      });
      
      const productName = result.identification.commonName;

      if (productName && productName.toLowerCase() !== 'unknown') {
        toast({
          title: t('imageSearch.productFound.title'),
          description: t('imageSearch.productFound.description', { productName }),
        });
        setIsOpen(false);
        router.push(`/search?q=${encodeURIComponent(productName)}`);
      } else {
        toast({
          variant: 'destructive',
          title: t('imageSearch.productNotFound.title'),
          description: t('imageSearch.productNotFound.description'),
        });
      }
    } catch (error) {
      console.error('Image search error:', error);
      toast({
        variant: 'destructive',
        title: t('imageSearch.error.title'),
        description: t('imageSearch.error.description'),
      });
    } finally {
      setIsLoading(false);
    }
  };
  
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
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera /> {t('imageSearch.title')}
          </DialogTitle>
          <DialogDescription>
            {t('imageSearch.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {previewUrl ? (
            <div className="relative aspect-video w-full rounded-md overflow-hidden border">
              <Image src={previewUrl} alt={t('imageSearch.previewAlt')} fill className="object-contain" />
            </div>
          ) : (
            <div
              className="flex flex-col items-center justify-center h-48 w-full border-2 border-dashed rounded-md cursor-pointer"
              onClick={() => document.getElementById('image-upload-input')?.click()}
            >
              <Upload className="h-8 w-8 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">{t('imageSearch.uploadPrompt')}</p>
            </div>
          )}
          <Input id="image-upload-input" type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            {t('dashboard.common.cancel')}
          </Button>
          <Button onClick={handleSearch} disabled={!selectedFile || isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('imageSearch.searchButton')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
