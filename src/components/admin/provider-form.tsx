"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { providerSchema } from "@/lib/schemas/provider";
import { createProviderAction, updateProviderAction } from "@/server/provider-actions";

type ProviderFormSchemaValues = z.infer<typeof providerSchema>;

interface ProviderFormProps {
  editingProvider: { id: string; name: string; refProvider: string } | null;
  onCancelEdit: () => void; // Sert à fermer la modal proprement sur succès ou annulation
}

export function ProviderForm({ editingProvider, onCancelEdit }: ProviderFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const isEditing = !!editingProvider;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ProviderFormSchemaValues>({
    resolver: zodResolver(providerSchema),
    defaultValues: {
      name: "",
      refProvider: "",
    },
  });

  // Synchronisation des valeurs si on passe un fournisseur à modifier, ou reset à blanc
  useEffect(() => {
    if (editingProvider) {
      setValue("name", editingProvider.name);
      setValue("refProvider", editingProvider.refProvider);
    } else {
      reset({
        name: "",
        refProvider: "",
      });
    }
  }, [editingProvider, setValue, reset]);

  const onSubmit = async (values: ProviderFormSchemaValues) => {
    setIsLoading(true);
    
    try {
      const res = isEditing
        ? await updateProviderAction(editingProvider.id, values)
        : await createProviderAction(values);

      if (res.success) {
        toast.success(res.message);
        reset();
        onCancelEdit(); // Ferme le Dialog/Modal automatiquement
        router.refresh();
      } else {
        toast.error(res.message);
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
        <Field>
          <FieldLabel htmlFor="name">Nom du Fournisseur</FieldLabel>
          <Input
            id="name"
            type="text"
            placeholder="Ex: Yamaha France"
            disabled={isLoading}
            {...register("name")}
          />
          {errors.name && (
            <p className="text-xs font-medium text-red-600 mt-1">{errors.name.message}</p>
          )}
        </Field>

        <Field>
          <FieldLabel htmlFor="refProvider">Référence Unique</FieldLabel>
          <Input
            id="refProvider"
            type="text"
            placeholder="Ex: YAM-01"
            disabled={isLoading}
            className="uppercase font-mono tracking-wider"
            {...register("refProvider")}
          />
          {errors.refProvider && (
            <p className="text-xs font-medium text-red-600 mt-1">{errors.refProvider.message}</p>
          )}
        </Field>

        <div className="flex justify-end gap-2 pt-4 border-t mt-4">
          <Button type="button" variant="outline" onClick={onCancelEdit} disabled={isLoading}>
            Annuler
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
            {isEditing ? "Enregistrer les modifications" : "Enregistrer le fournisseur"}
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}