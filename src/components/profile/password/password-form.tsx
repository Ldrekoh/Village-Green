"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { updatePasswordSchema, type UpdatePasswordValues } from "@/lib/schemas/profile";
import { updatePasswordProfileAction } from "@/server/profile-actions";

interface UpdatePasswordFormProps {
  onSuccess: () => void;
}

export function UpdatePasswordForm({ onSuccess }: UpdatePasswordFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdatePasswordValues>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
      revokeOtherSessions: true,
    },
  });

  const onSubmit = async (values: UpdatePasswordValues) => {
    setIsLoading(true);
    try {
      const { success, message } = await updatePasswordProfileAction({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
        revokeOtherSessions: values.revokeOtherSessions,
      });

      if (success) {
        toast.success(message as string);
        reset();
        onSuccess();
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
          <FieldLabel htmlFor="currentPassword">Mot de passe actuel</FieldLabel>
          <Input
            id="currentPassword"
            type="password"
            disabled={isLoading}
            {...register("currentPassword")}
          />
          {errors.currentPassword && (
            <p className="text-xs font-medium text-destructive mt-1">{errors.currentPassword.message}</p>
          )}
        </Field>

        <Field>
          <FieldLabel htmlFor="newPassword">Nouveau mot de passe</FieldLabel>
          <Input
            id="newPassword"
            type="password"
            disabled={isLoading}
            {...register("newPassword")}
          />
          {errors.newPassword && (
            <p className="text-xs font-medium text-destructive mt-1">{errors.newPassword.message}</p>
          )}
        </Field>

        <Field>
          <FieldLabel htmlFor="confirmPassword">Confirmer le nouveau mot de passe</FieldLabel>
          <Input
            id="confirmPassword"
            type="password"
            disabled={isLoading}
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && (
            <p className="text-xs font-medium text-destructive mt-1">{errors.confirmPassword.message}</p>
          )}
        </Field>

        {/* Checkbox de déconnexion globale */}
        <Field className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="revokeOtherSessions"
            disabled={isLoading}
            className="h-4 w-4 rounded border-gray-300 accent-primary"
            {...register("revokeOtherSessions")}
          />
          <FieldLabel htmlFor="revokeOtherSessions" className="text-xs select-none cursor-pointer">
            Déconnecter mes autres appareils
          </FieldLabel>
        </Field>

        <div className="flex justify-end gap-2 pt-4 border-t mt-4">
          <Button type="button" variant="outline" onClick={onSuccess} disabled={isLoading}>
            Annuler
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="size-4 animate-spin mr-2" />}
            Mettre à jour
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}