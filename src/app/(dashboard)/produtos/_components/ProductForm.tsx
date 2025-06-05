"use client";

import React, { useState, useEffect, useCallback } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { InputNumber } from "@/components/ui/input-number";
import { ProductGalleryUpload } from "./ProductGalleryUpload"; // Importando o novo componente
import { Upload, PlusCircle, Trash2, Settings2, X, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";

// --- Schemas --- 

const componentSchema = z.object({
  component_id: z.string().min(1, { message: "Selecione um componente." }),
  component_name: z.string().optional(),
  quantity: z.number().positive({ message: "Quantidade deve ser positiva." }),
});

const optionValueSchema = z.object({
  id: z.string().optional(),
  value: z.string().min(1, { message: "Valor não pode ser vazio." }),
});

const optionSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, { message: "Nome da opção não pode ser vazio." }),
  values: z.array(optionValueSchema).min(1, { message: "Adicione pelo menos um valor." }),
});

const variantOptionSchema = z.object({
  option_name: z.string(),
  option_value: z.string(),
});

const variantSchema = z.object({
  id: z.string().optional(),
  sku: z.string().optional(),
  price: z.number().positive().optional(),
  cost: z.number().positive().optional(),
  stock_quantity: z.number().int().nonnegative().optional(),
  image_url: z.string().url().optional(),
  options: z.array(variantOptionSchema),
});

const productFormSchema = z.object({
  name: z.string().min(2, { message: "Nome do produto deve ter pelo menos 2 caracteres." }),
  sku: z.string().optional(),
  description: z.string().optional(),
  category_id: z.string({ required_error: "Selecione uma categoria." }).min(1, "Selecione uma categoria."),
  price: z.number().positive({ message: "Preço base deve ser positivo." }).optional(),
  cost: z.number().positive({ message: "Custo base deve ser positivo." }).optional(),
  stock_quantity: z.number().int().nonnegative({ message: "Estoque base não pode ser negativo." }).optional(),
  image_url: z.string().url({ message: "URL da imagem inválida." }).optional(),
  status: z.string({ required_error: "Selecione um status." }).min(1, "Selecione um status."),
  components: z.array(componentSchema).optional(),
  options: z.array(optionSchema).optional(),
  variants: z.array(variantSchema).optional(),
});

// --- Types --- 

type ProductFormValues = z.infer<typeof productFormSchema>;
type ProductCategory = { id: string; name: string };
type ProductStatus = { id: string; name: string };
type AvailableComponent = { id: string; name: string; sku?: string | null };
type ProductImage = { id?: string; url: string; order_index: number; is_main: boolean; alt_text?: string };

// --- Props --- 

interface ProductFormProps {
  initialData?: Partial<ProductFormValues> & { id: string };
  onSuccess?: () => void;
}

// --- Helper Functions --- 

function generateVariantCombinations(options: z.infer<typeof optionSchema>[]): z.infer<typeof variantSchema>[] {
  if (!options || options.length === 0) return [];
  const optionArrays = options.map(opt => 
    opt.values.map(val => ({ option_name: opt.name, option_value: val.value }))
  );
  if (optionArrays.some(arr => arr.length === 0)) return [];
  return optionArrays.reduce((acc, currentOptionValues) => {
    if (acc.length === 0) return currentOptionValues.map(ov => ({ options: [ov] }));
    const newAcc: any[] = [];
    acc.forEach(existingVariant => {
      currentOptionValues.forEach(currentOptionValue => {
        newAcc.push({ options: [...existingVariant.options, currentOptionValue] });
      });
    });
    return newAcc;
  }, [] as any[]).map((variant: { options: z.infer<typeof variantOptionSchema>[] }) => ({
    ...variant,
    sku: undefined,
    price: undefined,
    cost: undefined,
    stock_quantity: 0,
    image_url: undefined,
  }));
}

// --- Component --- 

export function ProductForm({ initialData, onSuccess }: ProductFormProps) {
  const supabase = createClient();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(true);
  const [mainImageLoading, setMainImageLoading] = useState(false);
  const [variantImageLoadingStates, setVariantImageLoadingStates] = useState<Record<number, boolean>>({});
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [statuses, setStatuses] = useState<ProductStatus[]>([]);
  const [availableComponents, setAvailableComponents] = useState<AvailableComponent[]>([]);
  const [productImages, setProductImages] = useState<ProductImage[]>([]);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      sku: initialData?.sku || "",
      description: initialData?.description || "",
      category_id: initialData?.category_id || undefined,
      price: initialData?.price || undefined,
      cost: initialData?.cost || undefined,
      stock_quantity: initialData?.stock_quantity || 0,
      image_url: initialData?.image_url || undefined,
      status: initialData?.status || undefined,
      components: initialData?.components || [],
      options: initialData?.options || [],
      variants: initialData?.variants || [],
    },
  });

  const { fields: componentFields, append: appendComponent, remove: removeComponent } = useFieldArray({
    control: form.control,
    name: "components",
  });

  const { fields: optionFields, append: appendOption, remove: removeOption } = useFieldArray({
    control: form.control,
    name: "options",
  });

  const { fields: variantFields, replace: replaceVariants } = useFieldArray({
    control: form.control,
    name: "variants",
  });

  // Fetch related data
  useEffect(() => {
    const fetchDropdownData = async () => {
      setIsFetchingData(true);
      try {
        // Fetch Categories
        const { data: catData, error: catError } = await supabase
          .from("product_categories")
          .select("id, name")
          .order("name");
        if (catError) throw new Error(`Erro ao buscar categorias: ${catError.message}`);
        setCategories(catData || []);

        // Fetch Statuses
        const { data: statusData, error: statusError } = await supabase
          .from("product_statuses")
          .select("id, name")
          .order("name");
        if (statusError) throw new Error(`Erro ao buscar status: ${statusError.message}`);
        setStatuses(statusData || []);
        // Set default status if not editing
        if (!initialData?.status && statusData?.length > 0) {
            // Find a default status like 'Ativo' or the first one
            const defaultStatus = statusData.find(s => s.name.toLowerCase() === 'ativo') || statusData[0];
            if (defaultStatus) {
                form.setValue('status', defaultStatus.id);
            }
        }

        // Fetch potential components
        const { data: compData, error: compError } = await supabase
          .from("products")
          .select("id, name, sku")
          .neq("id", initialData?.id || "")
          .order("name");
        if (compError) throw new Error(`Erro ao buscar componentes: ${compError.message}`);
        setAvailableComponents(compData || []);

        // Fetch product images if editing
        if (initialData?.id) {
          const { data: imageData, error: imageError } = await supabase
            .from("product_images")
            .select("*")
            .eq("product_id", initialData.id)
            .order("order_index");
          
          if (imageError) throw new Error(`Erro ao buscar imagens do produto: ${imageError.message}`);
          
          if (imageData) {
            setProductImages(imageData.map(img => ({
              id: img.id,
              url: img.url,
              order_index: img.order_index,
              is_main: img.is_main,
              alt_text: img.alt_text
            })));
          }
        }

      } catch (error: any) {
        toast.error(error.message);
        console.error("Fetch error:", error);
      } finally {
        setIsFetchingData(false);
      }
    };
    fetchDropdownData();
  }, [initialData, supabase, form]);

  // Image Upload Logic for Variants
  const handleVariantImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, variantIndex: number) => {
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
    
    // Set loading state for this variant
    const variantLoadingStates = { ...variantImageLoadingStates };
    variantLoadingStates[variantIndex] = true;
    setVariantImageLoadingStates(variantLoadingStates);
    
    const toastId = toast.loading("Iniciando upload da imagem...");
    try {
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name.replace(/\s+/g, '_')}`;
      const filePath = `public/product-images/variants/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(filePath);
      if (!urlData.publicUrl) throw new Error("Não foi possível obter a URL pública da imagem.");

      form.setValue(`variants.${variantIndex}.image_url`, urlData.publicUrl, { shouldValidate: true });
      toast.success("Upload da imagem concluído!", { id: toastId });
    } catch (error: any) {
      console.error("Erro no upload da imagem:", error);
      toast.error(`Erro no upload: ${error.message}`, { id: toastId });
    } finally {
      const variantLoadingStates = { ...variantImageLoadingStates };
      variantLoadingStates[variantIndex] = false;
      setVariantImageLoadingStates(variantLoadingStates);
    }
  };

  // Handle gallery images update
  const handleGalleryUpdate = (images: ProductImage[]) => {
    setProductImages(images);
    
    // Update main image in form if there's a main image
    const mainImage = images.find(img => img.is_main);
    if (mainImage) {
      form.setValue("image_url", mainImage.url, { shouldValidate: true });
    } else if (images.length > 0) {
      // If no main image but there are images, use the first one
      form.setValue("image_url", images[0].url, { shouldValidate: true });
    } else {
      // No images at all
      form.setValue("image_url", undefined, { shouldValidate: true });
    }
  };

  // Variant Generation Logic
  const handleGenerateVariants = useCallback(() => {
    const currentOptions = form.getValues("options") || [];
    const validOptions = currentOptions.filter(opt => opt.name && opt.values && opt.values.length > 0 && opt.values.every(v => v.value));
    if (validOptions.length === 0) {
        toast.info("Adicione opções e valores antes de gerar variações.");
        replaceVariants([]);
        return;
    }
    const newVariants = generateVariantCombinations(validOptions);
    replaceVariants(newVariants);
    toast.success(`${newVariants.length} variações geradas/atualizadas.`);
  }, [form, replaceVariants]);

  // Submit Logic
  async function onSubmit(values: ProductFormValues) {
    setIsLoading(true);
    const toastId = toast.loading("Salvando produto...");
    try {
      const { components, options, variants, ...productData } = values;
      let productId = initialData?.id;

      // Ensure numeric fields are numbers or null
      const parseOptionalNumber = (val: any) => (val === '' || val === undefined || val === null || isNaN(Number(val))) ? null : Number(val);
      const productDataProcessed = {
          ...productData,
          price: parseOptionalNumber(productData.price),
          cost: parseOptionalNumber(productData.cost),
          stock_quantity: parseOptionalNumber(productData.stock_quantity ?? 0),
      };

      // 1. Upsert Product
      const { data: savedProduct, error: productError } = await supabase
        .from("products")
        .upsert({ ...(initialData?.id && { id: initialData.id }), ...productDataProcessed })
        .select("id")
        .single();
      if (productError) throw new Error(`Erro ao salvar produto: ${productError.message}`);
      productId = savedProduct.id;
      if (!productId) throw new Error("Falha ao obter ID do produto salvo.");

      // --- Handle Components (Delete/Insert) --- 
      await supabase.from("product_components").delete().eq("product_id", productId);
      if (components && components.length > 0) {
        const componentsToInsert = components.map(comp => ({
          product_id: productId,
          component_product_id: comp.component_id,
          quantity: comp.quantity,
        }));
        const { error: compInsertError } = await supabase.from("product_components").insert(componentsToInsert);
        if (compInsertError) throw new Error(`Erro ao salvar componentes: ${compInsertError.message}`);
      }

      // --- Handle Options & Values (Delete/Insert) --- 
      // Fetch existing option IDs for this product to delete values correctly
      const { data: existingOptionsData, error: fetchOptionsError } = await supabase
          .from("product_options")
          .select("id")
          .eq("product_id", productId);
      if (fetchOptionsError) console.error("Erro ao buscar opções existentes:", fetchOptionsError.message); // Non-fatal
      const existingOptionIds = existingOptionsData?.map(o => o.id) || [];
      if (existingOptionIds.length > 0) {
          await supabase.from("product_option_values").delete().in("option_id", existingOptionIds);
      }
      await supabase.from("product_options").delete().eq("product_id", productId);
      if (options && options.length > 0) {
        for (const option of options) {
          const { data: savedOption, error: optionError } = await supabase
            .from("product_options")
            .insert({ product_id: productId, name: option.name })
            .select("id")
            .single();
          if (optionError) throw new Error(`Erro ao salvar opção '${option.name}': ${optionError.message}`);
          const optionId = savedOption.id;
          if (!optionId) continue;

          const valuesToInsert = option.values.map(val => ({ option_id: optionId, value: val.value }));
          const { error: valueError } = await supabase.from("product_option_values").insert(valuesToInsert);
          if (valueError) throw new Error(`Erro ao salvar valores para opção '${option.name}': ${valueError.message}`);
        }
      }

      // --- Handle Variants (Delete/Insert) --- 
      await supabase.from("product_variant_options").delete().eq("variant_id", productId);
      await supabase.from("product_variants").delete().eq("product_id", productId);
      if (variants && variants.length > 0) {
        for (const variant of variants) {
          const variantData = {
            product_id: productId,
            sku: variant.sku || null,
            price: parseOptionalNumber(variant.price),
            cost: parseOptionalNumber(variant.cost),
            stock_quantity: parseOptionalNumber(variant.stock_quantity) ?? 0,
            image_url: variant.image_url || null,
          };
          
          const { data: savedVariant, error: variantError } = await supabase
            .from("product_variants")
            .insert(variantData)
            .select("id")
            .single();
          if (variantError) throw new Error(`Erro ao salvar variante: ${variantError.message}`);
          const variantId = savedVariant.id;
          if (!variantId) continue;

          const optionsToInsert = variant.options.map(opt => ({
            variant_id: variantId,
            option_name: opt.option_name,
            option_value: opt.option_value,
          }));
          const { error: optionError } = await supabase.from("product_variant_options").insert(optionsToInsert);
          if (optionError) throw new Error(`Erro ao salvar opções da variante: ${optionError.message}`);
        }
      }

      toast.success("Produto salvo com sucesso!", { id: toastId });
      if (onSuccess) onSuccess();
      router.push("/produtos");
    } catch (error: any) {
      console.error("Erro ao salvar produto:", error);
      toast.error(`Erro ao salvar: ${error.message}`, { id: toastId });
    } finally {
      setIsLoading(false);
    }
  }

  if (isFetchingData) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Carregando dados...</span>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Produto</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do produto" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU</FormLabel>
                    <FormControl>
                      <Input placeholder="SKU do produto" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Descrição do produto" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
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
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {statuses.map((status) => (
                          <SelectItem key={status.id} value={status.id}>
                            {status.name}
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
          
          {/* Preço e Estoque */}
          <Card>
            <CardHeader>
              <CardTitle>Preço e Estoque</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço Base (R$)</FormLabel>
                    <FormControl>
                      <InputNumber 
                        placeholder="0,00" 
                        value={field.value} 
                        onChange={field.onChange}
                        min={0}
                        step={0.01}
                        decimalPlaces={2}
                        prefix="R$ "
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custo Base (R$)</FormLabel>
                    <FormControl>
                      <InputNumber 
                        placeholder="0,00" 
                        value={field.value} 
                        onChange={field.onChange}
                        min={0}
                        step={0.01}
                        decimalPlaces={2}
                        prefix="R$ "
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="stock_quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantidade em Estoque</FormLabel>
                    <FormControl>
                      <InputNumber 
                        placeholder="0" 
                        value={field.value} 
                        onChange={field.onChange}
                        min={0}
                        step={1}
                        decimalPlaces={0}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </div>
        
        {/* Galeria de Imagens */}
        {initialData?.id ? (
          <ProductGalleryUpload 
            productId={initialData.id}
            initialImages={productImages}
            onSuccess={handleGalleryUpdate}
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Galeria de Imagens</CardTitle>
              <CardDescription>
                Salve o produto primeiro para adicionar imagens à galeria.
              </CardDescription>
            </CardHeader>
          </Card>
        )}
        
        {/* Componentes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Componentes</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => appendComponent({ component_id: "", component_name: "", quantity: 1 })}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Adicionar Componente
            </Button>
          </CardHeader>
          <CardContent>
            {componentFields.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                Nenhum componente adicionado.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Componente</TableHead>
                    <TableHead className="w-[100px]">Quantidade</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {componentFields.map((field, index) => (
                    <TableRow key={field.id}>
                      <TableCell>
                        <FormField
                          control={form.control}
                          name={`components.${index}.component_id`}
                          render={({ field: componentField }) => (
                            <FormItem className="space-y-0">
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant="outline"
                                      role="combobox"
                                      className="w-full justify-between"
                                    >
                                      {componentField.value
                                        ? availableComponents.find(
                                            (component) => component.id === componentField.value
                                          )?.name || "Selecione um componente"
                                        : "Selecione um componente"}
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-[300px] p-0">
                                  <Command>
                                    <CommandInput placeholder="Buscar componente..." />
                                    <CommandList>
                                      <CommandEmpty>Nenhum componente encontrado.</CommandEmpty>
                                      <CommandGroup>
                                        {availableComponents.map((component) => (
                                          <CommandItem
                                            key={component.id}
                                            value={component.name}
                                            onSelect={() => {
                                              form.setValue(
                                                `components.${index}.component_id`,
                                                component.id,
                                                { shouldValidate: true }
                                              );
                                              form.setValue(
                                                `components.${index}.component_name`,
                                                component.name
                                              );
                                            }}
                                          >
                                            {component.name}
                                            {component.sku && (
                                              <span className="ml-2 text-xs text-muted-foreground">
                                                ({component.sku})
                                              </span>
                                            )}
                                          </CommandItem>
                                        ))}
                                      </CommandGroup>
                                    </CommandList>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <FormField
                          control={form.control}
                          name={`components.${index}.quantity`}
                          render={({ field: quantityField }) => (
                            <FormItem className="space-y-0">
                              <FormControl>
                                <InputNumber
                                  value={quantityField.value}
                                  onChange={quantityField.onChange}
                                  min={1}
                                  step={1}
                                  decimalPlaces={0}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeComponent(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        
        {/* Opções e Variantes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Opções e Variantes</CardTitle>
            <div className="flex space-x-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendOption({ name: "", values: [{ value: "" }] })}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Adicionar Opção
              </Button>
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={handleGenerateVariants}
                disabled={form.getValues("options")?.length === 0}
              >
                <Settings2 className="h-4 w-4 mr-2" />
                Gerar Variantes
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Opções */}
            {optionFields.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                Nenhuma opção adicionada.
              </div>
            ) : (
              <div className="space-y-4">
                {optionFields.map((field, optionIndex) => (
                  <div key={field.id} className="border rounded-md p-4">
                    <div className="flex justify-between items-center mb-4">
                      <FormField
                        control={form.control}
                        name={`options.${optionIndex}.name`}
                        render={({ field: nameField }) => (
                          <FormItem className="flex-1 mr-4">
                            <FormLabel>Nome da Opção</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: Cor, Tamanho, Material" {...nameField} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="mt-6"
                        onClick={() => removeOption(optionIndex)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      <FormLabel>Valores</FormLabel>
                      {form.getValues(`options.${optionIndex}.values`)?.map((_, valueIndex) => (
                        <div key={valueIndex} className="flex items-center space-x-2">
                          <FormField
                            control={form.control}
                            name={`options.${optionIndex}.values.${valueIndex}.value`}
                            render={({ field: valueField }) => (
                              <FormItem className="flex-1">
                                <FormControl>
                                  <Input placeholder="Valor da opção" {...valueField} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              const currentValues = form.getValues(`options.${optionIndex}.values`);
                              if (currentValues.length > 1) {
                                const newValues = [...currentValues];
                                newValues.splice(valueIndex, 1);
                                form.setValue(`options.${optionIndex}.values`, newValues);
                              } else {
                                toast.info("Opção deve ter pelo menos um valor.");
                              }
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => {
                          const currentValues = form.getValues(`options.${optionIndex}.values`) || [];
                          form.setValue(`options.${optionIndex}.values`, [...currentValues, { value: "" }]);
                        }}
                      >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Adicionar Valor
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Variantes */}
            {variantFields.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-4">Variantes ({variantFields.length})</h3>
                <div className="space-y-4">
                  {variantFields.map((field, variantIndex) => (
                    <div key={field.id} className="border rounded-md p-4">
                      <div className="flex flex-wrap gap-2 mb-4">
                        {field.options.map((option, optionIndex) => (
                          <Badge key={optionIndex} variant="secondary">
                            {option.option_name}: {option.option_value}
                          </Badge>
                        ))}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`variants.${variantIndex}.sku`}
                          render={({ field: skuField }) => (
                            <FormItem>
                              <FormLabel>SKU da Variante</FormLabel>
                              <FormControl>
                                <Input placeholder="SKU da variante" {...skuField} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name={`variants.${variantIndex}.price`}
                          render={({ field: priceField }) => (
                            <FormItem>
                              <FormLabel>Preço (R$)</FormLabel>
                              <FormControl>
                                <InputNumber 
                                  placeholder="0,00" 
                                  value={priceField.value} 
                                  onChange={priceField.onChange}
                                  min={0}
                                  step={0.01}
                                  decimalPlaces={2}
                                  prefix="R$ "
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name={`variants.${variantIndex}.cost`}
                          render={({ field: costField }) => (
                            <FormItem>
                              <FormLabel>Custo (R$)</FormLabel>
                              <FormControl>
                                <InputNumber 
                                  placeholder="0,00" 
                                  value={costField.value} 
                                  onChange={costField.onChange}
                                  min={0}
                                  step={0.01}
                                  decimalPlaces={2}
                                  prefix="R$ "
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name={`variants.${variantIndex}.stock_quantity`}
                          render={({ field: stockField }) => (
                            <FormItem>
                              <FormLabel>Estoque</FormLabel>
                              <FormControl>
                                <InputNumber 
                                  placeholder="0" 
                                  value={stockField.value} 
                                  onChange={stockField.onChange}
                                  min={0}
                                  step={1}
                                  decimalPlaces={0}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="mt-4">
                        <FormField
                          control={form.control}
                          name={`variants.${variantIndex}.image_url`}
                          render={({ field: imageField }) => (
                            <FormItem>
                              <FormLabel>Imagem da Variante</FormLabel>
                              <div className="flex items-center space-x-4">
                                {imageField.value ? (
                                  <div className="relative w-24 h-24 border rounded-md overflow-hidden">
                                    <img
                                      src={imageField.value}
                                      alt={`Variante ${variantIndex + 1}`}
                                      className="object-cover w-full h-full"
                                    />
                                    <Button
                                      type="button"
                                      variant="destructive"
                                      size="icon"
                                      className="absolute top-1 right-1 h-6 w-6"
                                      onClick={() => form.setValue(`variants.${variantIndex}.image_url`, undefined)}
                                      disabled={isLoading || variantImageLoadingStates[variantIndex]}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="w-24 h-24 border rounded-md flex items-center justify-center">
                                    {variantImageLoadingStates[variantIndex] ? (
                                      <Loader2 className="h-6 w-6 animate-spin" />
                                    ) : (
                                      <div className="text-center">
                                        <Upload className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
                                        <span className="text-xs text-muted-foreground">Sem imagem</span>
                                      </div>
                                    )}
                                  </div>
                                )}
                                <div>
                                  <input
                                    type="file"
                                    id={`variant-image-${variantIndex}`}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => handleVariantImageUpload(e, variantIndex)}
                                    disabled={isLoading || variantImageLoadingStates[variantIndex]}
                                  />
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => document.getElementById(`variant-image-${variantIndex}`)?.click()}
                                    disabled={isLoading || variantImageLoadingStates[variantIndex]}
                                  >
                                    {variantImageLoadingStates[variantIndex] ? (
                                      <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Enviando...
                                      </>
                                    ) : (
                                      <>
                                        <Upload className="h-4 w-4 mr-2" />
                                        {imageField.value ? "Trocar Imagem" : "Enviar Imagem"}
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/produtos")}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>Salvar Produto</>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
