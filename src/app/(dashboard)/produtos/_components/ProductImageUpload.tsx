"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { ImageUpload } from "@/components/ui/image-upload";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface ProductImageUploadProps {
  productId: string;
  initialImage?: string;
  onSuccess?: (imageUrl: string) => void;
}

export function ProductImageUpload({ productId, initialImage, onSuccess }: ProductImageUploadProps) {
  const supabase = createClient();
  const [imageUrl, setImageUrl] = useState<string>(initialImage || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 5MB.");
      return;
    }
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error("Formato de arquivo não suportado. Use PNG, JPG ou WEBP.");
      return;
    }
    
    setIsLoading(true);
    const toastId = toast.loading("Enviando imagem...");
    
    try {
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name.replace(/\s+/g, '_')}`;
      const filePath = `public/product-images/${productId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, file);
        
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("product-images")
        .getPublicUrl(filePath);
        
      if (!urlData.publicUrl) {
        throw new Error("Não foi possível obter a URL pública da imagem.");
      }

      // Update product image in database
      const { error: updateError } = await supabase
        .from("products")
        .update({ image_url: urlData.publicUrl })
        .eq("id", productId);
        
      if (updateError) {
        throw updateError;
      }

      setImageUrl(urlData.publicUrl);
      toast.success("Imagem atualizada com sucesso!", { id: toastId });
      
      if (onSuccess) {
        onSuccess(urlData.publicUrl);
      }
    } catch (error: any) {
      console.error("Erro no upload da imagem:", error);
      toast.error(`Erro no upload: ${error.message}`, { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Imagem do Produto</CardTitle>
      </CardHeader>
      <CardContent>
        <ImageUpload
          value={imageUrl}
          onChange={setImageUrl}
          onUpload={handleImageUpload}
          disabled={isLoading}
          isLoading={isLoading}
          label="Imagem Principal"
        />
        <p className="text-xs text-muted-foreground mt-2">
          Formatos aceitos: PNG, JPG ou WEBP (máx. 5MB)
        </p>
      </CardContent>
    </Card>
  );
}
