"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { companyProfileSchema, type CompanyProfileValues } from "@/lib/schemas/profile";
import { updateCompanyProfileAction } from "@/server/profile-actions";

interface CompanyFormProps {
  initialData: {
    companyName: string;
    siret: string;
    vatNumber: string;
  } | null;
  onSuccess: () => void;
}

export function CompanyProfileForm({ initialData, onSuccess }: CompanyFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CompanyProfileValues>({
    resolver: zodResolver(companyProfileSchema),
    defaultValues: {
      companyName: initialData?.companyName || "",
      siret: initialData?.siret || "",
      vatNumber: initialData?.vatNumber || "",
    },
  });

  const onSubmit = async (values: CompanyProfileValues) => {
    setIsLoading(true);
    try {
      const { success, message } = await updateCompanyProfileAction(values);
      
      if (success) {
        toast.success(message as string);
        onSuccess(); // Ferme le Dialog
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
        <Field>
          <FieldLabel htmlFor="companyName">Raison Sociale</FieldLabel>
          <Input
            id="companyName"
            type="text"
            disabled={isLoading}
            placeholder="Ex: Ma Société SAS"
            {...register("companyName")}
          />
          {errors.companyName && (
            <p className="text-xs font-medium text-destructive mt-1">{errors.companyName.message}</p>
          )}
        </Field>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field>
            <FieldLabel htmlFor="siret">Numéro SIRET (14 chiffres)</FieldLabel>
            <Input
              id="siret"
              type="text"
              maxLength={14}
              disabled={isLoading}
              placeholder="12345678901234"
              {...register("siret")}
            />
            {errors.siret && (
              <p className="text-xs font-medium text-destructive mt-1">{errors.siret.message}</p>
            )}
          </Field>

          <Field>
            <FieldLabel htmlFor="vatNumber">Numéro de TVA Intracommunautaire</FieldLabel>
            <Input
              id="vatNumber"
              type="text"
              disabled={isLoading}
              placeholder="FR12345678901"
              {...register("vatNumber")}
            />
            {errors.vatNumber && (
              <p className="text-xs font-medium text-destructive mt-1">{errors.vatNumber.message}</p>
            )}
          </Field>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t mt-4">
          <Button type="button" variant="outline" onClick={onSuccess} disabled={isLoading}>
            Annuler
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="size-4 animate-spin mr-2" />}
            Sauvegarder l'entreprise
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}