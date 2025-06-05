"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { ImageUpload } from "@/components/ui/image-upload";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Loader2, Plus, X, ArrowUp, ArrowDown } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface ProductImage {
  id?: string;
  url: string;
  order_index: number;
  is_main: boolean;
  alt_text?: string;
}

interface ProductGalleryUploadProps {
  productId: string;
  initialImages?: ProductImage[];
  onSuccess?: (images: ProductImage[]) => void;
}

export function ProductGalleryUpload({ productId, initialImages = [], onSuccess }: ProductGalleryUploadProps) {
  const supabase = createClient();
  const [images, setImages] = useState<ProductImage[]>(initialImages);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  useEffect(() => {
    // Carregar imagens existentes do produto se não foram fornecidas
    if (initialImages.length === 0 && productId) {
      fetchProductImages();
    }
  }, [productId]);

  const fetchProductImages = async () => {
    try {
      const { data, error } = await supabase
        .from("product_images")
        .select("*")
        .eq("product_id", productId)
        .order("order_index", { ascending: true });

      if (error) throw error;
      
      if (data) {
        setImages(data.map(img => ({
          id: img.id,
          url: img.url,
          order_index: img.order_index,
          is_main: img.is_main,
          alt_text: img.alt_text
        })));
      }
    } catch (error: any) {
      console.error("Erro ao carregar imagens:", error);
      toast.error(`Erro ao carregar imagens: ${error.message}`);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, index?: number) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Validar tamanho do arquivo (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 5MB.");
      return;
    }
    
    // Validar tipo de arquivo
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error("Formato de arquivo não suportado. Use PNG, JPG ou WEBP.");
      return;
    }
    
    setIsLoading(true);
    if (index !== undefined) {
      setUploadingIndex(index);
    } else {
      setUploadingIndex(images.length);
    }
    
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

      // Determinar se esta é a imagem principal (primeira imagem ou substituindo a principal)
      const isMain = images.length === 0 || (index !== undefined && images[index].is_main);
      
      // Determinar o índice de ordem (último + 1 ou manter o existente)
      const maxOrderIndex = images.length > 0 
        ? Math.max(...images.map(img => img.order_index)) 
        : -1;
      const orderIndex = index !== undefined 
        ? images[index].order_index 
        : maxOrderIndex + 1;

      // Criar ou atualizar a imagem no banco de dados
      let newImageId;
      
      if (index !== undefined && images[index].id) {
        // Atualizar imagem existente
        const { error: updateError } = await supabase
          .from("product_images")
          .update({ 
            url: urlData.publicUrl,
            updated_at: new Date().toISOString()
          })
          .eq("id", images[index].id);
          
        if (updateError) throw updateError;
        newImageId = images[index].id;
      } else {
        // Inserir nova imagem
        const { data: insertData, error: insertError } = await supabase
          .from("product_images")
          .insert({ 
            product_id: productId,
            url: urlData.publicUrl,
            order_index: orderIndex,
            is_main: isMain,
            alt_text: file.name.split('.')[0].replace(/_/g, ' ')
          })
          .select("id")
          .single();
          
        if (insertError) throw insertError;
        newImageId = insertData.id;
      }

      // Atualizar o estado local
      if (index !== undefined) {
        // Substituir imagem existente
        const updatedImages = [...images];
        updatedImages[index] = {
          ...updatedImages[index],
          url: urlData.publicUrl,
          id: newImageId
        };
        setImages(updatedImages);
      } else {
        // Adicionar nova imagem
        setImages([...images, {
          id: newImageId,
          url: urlData.publicUrl,
          order_index: orderIndex,
          is_main: isMain,
          alt_text: file.name.split('.')[0].replace(/_/g, ' ')
        }]);
      }

      // Se esta é a primeira imagem, também atualizar a imagem principal do produto
      if (isMain) {
        const { error: productUpdateError } = await supabase
          .from("products")
          .update({ image_url: urlData.publicUrl })
          .eq("id", productId);
          
        if (productUpdateError) {
          console.error("Erro ao atualizar imagem principal do produto:", productUpdateError);
          // Não interromper o fluxo por causa deste erro
        }
      }

      toast.success("Imagem atualizada com sucesso!", { id: toastId });
      
      if (onSuccess) {
        onSuccess(index !== undefined 
          ? [...images.slice(0, index), { ...images[index], url: urlData.publicUrl, id: newImageId }, ...images.slice(index + 1)]
          : [...images, { id: newImageId, url: urlData.publicUrl, order_index: orderIndex, is_main: isMain }]
        );
      }
    } catch (error: any) {
      console.error("Erro no upload da imagem:", error);
      toast.error(`Erro no upload: ${error.message}`, { id: toastId });
    } finally {
      setIsLoading(false);
      setUploadingIndex(null);
    }
  };

  const handleRemoveImage = async (index: number) => {
    if (!images[index] || !images[index].id) return;
    
    const imageId = images[index].id;
    const isMainImage = images[index].is_main;
    
    setIsLoading(true);
    const toastId = toast.loading("Removendo imagem...");
    
    try {
      // Remover do banco de dados
      const { error } = await supabase
        .from("product_images")
        .delete()
        .eq("id", imageId);
        
      if (error) throw error;
      
      // Se era a imagem principal, definir a primeira imagem restante como principal
      if (isMainImage && images.length > 1) {
        const newMainIndex = index === 0 ? 1 : 0;
        const newMainId = images[newMainIndex].id;
        
        if (newMainId) {
          const { error: updateError } = await supabase
            .from("product_images")
            .update({ is_main: true })
            .eq("id", newMainId);
            
          if (updateError) throw updateError;
          
          // Atualizar também a imagem principal do produto
          const { error: productUpdateError } = await supabase
            .from("products")
            .update({ image_url: images[newMainIndex].url })
            .eq("id", productId);
            
          if (productUpdateError) {
            console.error("Erro ao atualizar imagem principal do produto:", productUpdateError);
          }
          
          // Atualizar estado local
          const updatedImages = [...images];
          updatedImages[newMainIndex] = { ...updatedImages[newMainIndex], is_main: true };
          updatedImages.splice(index, 1);
          setImages(updatedImages);
          
          if (onSuccess) {
            onSuccess(updatedImages);
          }
        }
      } else {
        // Remover do estado local
        const updatedImages = [...images];
        updatedImages.splice(index, 1);
        setImages(updatedImages);
        
        if (onSuccess) {
          onSuccess(updatedImages);
        }
      }
      
      toast.success("Imagem removida com sucesso!", { id: toastId });
    } catch (error: any) {
      console.error("Erro ao remover imagem:", error);
      toast.error(`Erro ao remover imagem: ${error.message}`, { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetMainImage = async (index: number) => {
    if (!images[index] || !images[index].id || images[index].is_main) return;
    
    setIsLoading(true);
    const toastId = toast.loading("Definindo imagem principal...");
    
    try {
      // Encontrar a imagem principal atual
      const currentMainIndex = images.findIndex(img => img.is_main);
      const newMainId = images[index].id;
      
      // Atualizar no banco de dados
      if (currentMainIndex !== -1 && images[currentMainIndex].id) {
        // Remover flag da imagem principal atual
        const { error: updateOldError } = await supabase
          .from("product_images")
          .update({ is_main: false })
          .eq("id", images[currentMainIndex].id);
          
        if (updateOldError) throw updateOldError;
      }
      
      // Definir nova imagem principal
      const { error: updateNewError } = await supabase
        .from("product_images")
        .update({ is_main: true })
        .eq("id", newMainId);
        
      if (updateNewError) throw updateNewError;
      
      // Atualizar imagem principal do produto
      const { error: productUpdateError } = await supabase
        .from("products")
        .update({ image_url: images[index].url })
        .eq("id", productId);
        
      if (productUpdateError) {
        console.error("Erro ao atualizar imagem principal do produto:", productUpdateError);
      }
      
      // Atualizar estado local
      const updatedImages = [...images];
      if (currentMainIndex !== -1) {
        updatedImages[currentMainIndex] = { ...updatedImages[currentMainIndex], is_main: false };
      }
      updatedImages[index] = { ...updatedImages[index], is_main: true };
      setImages(updatedImages);
      
      if (onSuccess) {
        onSuccess(updatedImages);
      }
      
      toast.success("Imagem principal atualizada!", { id: toastId });
    } catch (error: any) {
      console.error("Erro ao definir imagem principal:", error);
      toast.error(`Erro ao definir imagem principal: ${error.message}`, { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReorderImage = async (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) || 
      (direction === 'down' && index === images.length - 1) ||
      !images[index].id
    ) return;
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (!images[newIndex].id) return;
    
    setIsLoading(true);
    const toastId = toast.loading("Reordenando imagens...");
    
    try {
      // Trocar os índices de ordem no banco de dados
      const currentOrderIndex = images[index].order_index;
      const targetOrderIndex = images[newIndex].order_index;
      
      // Atualizar a imagem atual
      const { error: updateCurrentError } = await supabase
        .from("product_images")
        .update({ order_index: targetOrderIndex })
        .eq("id", images[index].id);
        
      if (updateCurrentError) throw updateCurrentError;
      
      // Atualizar a imagem alvo
      const { error: updateTargetError } = await supabase
        .from("product_images")
        .update({ order_index: currentOrderIndex })
        .eq("id", images[newIndex].id);
        
      if (updateTargetError) throw updateTargetError;
      
      // Atualizar estado local
      const updatedImages = [...images];
      updatedImages[index] = { ...updatedImages[index], order_index: targetOrderIndex };
      updatedImages[newIndex] = { ...updatedImages[newIndex], order_index: currentOrderIndex };
      
      // Reordenar array
      [updatedImages[index], updatedImages[newIndex]] = [updatedImages[newIndex], updatedImages[index]];
      
      setImages(updatedImages);
      
      if (onSuccess) {
        onSuccess(updatedImages);
      }
      
      toast.success("Imagens reordenadas com sucesso!", { id: toastId });
    } catch (error: any) {
      console.error("Erro ao reordenar imagens:", error);
      toast.error(`Erro ao reordenar imagens: ${error.message}`, { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddImage = () => {
    // Simular clique no input file
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.onchange = (e) => handleImageUpload(e as React.ChangeEvent<HTMLInputElement>);
    fileInput.click();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Galeria de Imagens</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Imagens existentes */}
          {images.map((image, index) => (
            <div 
              key={image.id || index} 
              className={cn(
                "relative border rounded-md overflow-hidden h-[200px]",
                image.is_main ? "ring-2 ring-primary" : ""
              )}
            >
              <Image
                src={image.url}
                alt={image.alt_text || `Imagem ${index + 1}`}
                fill
                style={{ objectFit: "cover" }}
                className="rounded-md"
              />
              
              {/* Indicador de imagem principal */}
              {image.is_main && (
                <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-md">
                  Principal
                </div>
              )}
              
              {/* Controles */}
              <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-2 flex justify-between items-center">
                <div className="flex space-x-1">
                  {/* Botão para mover para cima */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-white hover:text-white hover:bg-black/30"
                    onClick={() => handleReorderImage(index, 'up')}
                    disabled={isLoading || index === 0}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  
                  {/* Botão para mover para baixo */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-white hover:text-white hover:bg-black/30"
                    onClick={() => handleReorderImage(index, 'down')}
                    disabled={isLoading || index === images.length - 1}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex space-x-1">
                  {/* Botão para definir como principal */}
                  {!image.is_main && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 text-white hover:text-white hover:bg-black/30 text-xs"
                      onClick={() => handleSetMainImage(index)}
                      disabled={isLoading}
                    >
                      Definir como principal
                    </Button>
                  )}
                  
                  {/* Botão para remover */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-white hover:text-white hover:bg-red-500/70"
                    onClick={() => handleRemoveImage(index)}
                    disabled={isLoading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* Indicador de carregamento */}
              {uploadingIndex === index && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <Loader2 className="h-8 w-8 animate-spin text-white" />
                </div>
              )}
            </div>
          ))}
          
          {/* Botão para adicionar nova imagem */}
          <Button
            type="button"
            variant="outline"
            className="h-[200px] flex flex-col items-center justify-center border-dashed"
            onClick={handleAddImage}
            disabled={isLoading}
          >
            {isLoading && uploadingIndex === images.length ? (
              <Loader2 className="h-8 w-8 animate-spin mb-2" />
            ) : (
              <Plus className="h-8 w-8 mb-2" />
            )}
            <span>Adicionar Imagem</span>
          </Button>
        </div>
        
        <p className="text-xs text-muted-foreground mt-4">
          Formatos aceitos: PNG, JPG ou WEBP (máx. 5MB)
        </p>
      </CardContent>
    </Card>
  );
}
