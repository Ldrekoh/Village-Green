"use client";

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Upload, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { personalProfileSchema, type PersonalProfileValues } from "@/lib/schemas/profile";
import { updatePersonalProfileAction } from "@/server/profile-actions";

interface PersonalFormProps {
  initialData: {
    name: string;
    email: string;
    image: string | null;
  };
  onSuccess: () => void;
}

export function PersonalProfileForm({ initialData, onSuccess }: PersonalFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialData.image);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<PersonalProfileValues>({
    resolver: zodResolver(personalProfileSchema),
    defaultValues: {
      name: initialData.name,
      image: initialData.image || "", // Garde la valeur actuelle ou une string vide
    },
  });

  // Gestion du changement de fichier
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation rapide de la taille (ex: 2 Mo max)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("L'image ne doit pas dépasser 2 Mo.");
      return;
    }

    // Création d'une URL de preview locale temporaire
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);

    // ICI : Tu as deux options selon ton backend :
    // Option A : Convertir en Base64 si ton action attend une string URI
    const reader = new FileReader();
    reader.onloadend = () => {
      setValue("image", reader.result as string); 
    };
    reader.readAsDataURL(file);

    // Option B : Si tu utilises un upload cloud (S3/Cloudinary), tu lancerais 
    // l'upload ici directement et ferais le setValue avec l'URL finale.
  };

  // Nettoyage de la mémoire pour éviter les fuites d'URLs temporaires
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const onSubmit = async (values: PersonalProfileValues) => {
    setIsLoading(true);
    try {
      const { success, message } = await updatePersonalProfileAction(values);
      
      if (success) {
        toast.success(message as string);
        onSuccess();
        router.refresh();
      } else {
        toast.error(message as string);
      }
    } catch {
      toast.error("Une erreur inattendue est survenue.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
      <FieldGroup className="space-y-4">
        
        {/* SECTION PREVIEW & UPLOAD FILE */}
        <div className="flex flex-col items-center gap-4 py-2 border-b pb-4">
          <Avatar className="h-24 w-24 border-2 border-muted shadow-sm">
            {previewUrl ? (
              <AvatarImage src={previewUrl} alt={initialData.name} className="object-cover" />
            ) : null}
            <AvatarFallback className="bg-secondary text-secondary-foreground text-xl">
              <User className="h-10 w-10 text-muted-foreground" />
            </AvatarFallback>
          </Avatar>

          {/* Input file caché pour des raisons de style */}
          <input
            type="file"
            id="avatar-upload"
            ref={fileInputRef}
            accept="image/png, image/jpeg, image/webp"
            className="hidden"
            onChange={handleFileChange}
            disabled={isLoading}
          />

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isLoading}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4 mr-2" />
            Choisir une image
          </Button>
          <p className="text-[10px] text-muted-foreground">PNG, JPEG ou WEBP. Maximum 2 Mo.</p>
        </div>

        {/* CHAMPS TRADITIONNELS */}
        <Field>
          <FieldLabel htmlFor="email">Adresse e-mail (Non modifiable)</FieldLabel>
          <Input id="email" type="email" value={initialData.email} disabled className="bg-muted" />
        </Field>

        <Field>
          <FieldLabel htmlFor="name">Nom Complet</FieldLabel>
          <Input
            id="name"
            type="text"
            disabled={isLoading}
            placeholder="John Doe"
            {...register("name")}
          />
          {errors.name && (
            <p className="text-xs font-medium text-destructive mt-1">{errors.name.message}</p>
          )}
        </Field>

        <div className="flex justify-end gap-2 pt-4 border-t mt-4">
          <Button type="button" variant="outline" onClick={onSuccess} disabled={isLoading}>
            Annuler
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="size-4 animate-spin mr-2" />}
            Sauvegarder mes infos
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}