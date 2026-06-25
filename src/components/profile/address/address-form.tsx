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
import { addressSchema } from "@/lib/schemas/address";
import { manageUserAddressesAction } from "@/server/profile-actions";
import type { AddressItem } from "@/db/schema";

type AddressFormSchemaValues = z.infer<typeof addressSchema>;

interface AddressFormProps {
  editingAddress: AddressItem | null;
  onCancelEdit: () => void; // Sert à fermer la modal proprement
}

export function AddressForm({ editingAddress, onCancelEdit }: AddressFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const isEditing = !!editingAddress;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<AddressFormSchemaValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      street: "",
      complement: "",
      zipCode: "",
      city: "",
      country: "France",
      isDefaultDelivery: false,
      isDefaultBilling: false,
    },
  });

  useEffect(() => {
    if (editingAddress) {
      setValue("street", editingAddress.street);
      setValue("complement", editingAddress.complement || "");
      setValue("zipCode", editingAddress.zipCode);
      setValue("city", editingAddress.city);
      setValue("country", editingAddress.country);
      setValue("isDefaultDelivery", !!editingAddress.isDefaultDelivery);
      setValue("isDefaultBilling", !!editingAddress.isDefaultBilling);
    } else {
      reset({
        street: "",
        complement: "",
        zipCode: "",
        city: "",
        country: "France",
        isDefaultDelivery: false,
        isDefaultBilling: false,
      });
    }
  }, [editingAddress, setValue, reset]);

  const onSubmit = async (values: AddressFormSchemaValues) => {
    setIsLoading(true);
    const addressId = isEditing ? editingAddress.id : crypto.randomUUID();
    const intent = isEditing ? "UPDATE" : "ADD";
    
    try {
      const { success, message } = await manageUserAddressesAction(intent, {
        addressId,
        addressData: {
          street: values.street,
          city: values.city,
          zipCode: values.zipCode,
          country: values.country,
          complement: values.complement || undefined,
          isDefaultDelivery: !!values.isDefaultDelivery,
          isDefaultBilling: !!values.isDefaultBilling,
        },
      });

      if (success) {
        toast.success(message as string);
        reset();
        onCancelEdit(); // Ferme le Dialog automatiquement sur réussite
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
          <FieldLabel htmlFor="street">Rue</FieldLabel>
          <Input
            id="street"
            type="text"
            placeholder="12 rue de la Paix"
            disabled={isLoading}
            {...register("street")}
          />
          {errors.street && (
            <p className="text-xs font-medium text-red-600 mt-1">{errors.street.message}</p>
          )}
        </Field>

        <Field>
          <FieldLabel htmlFor="complement">Complément</FieldLabel>
          <Input
            id="complement"
            type="text"
            placeholder="Bâtiment, Apt..."
            disabled={isLoading}
            {...register("complement")}
          />
        </Field>

        <div className="grid grid-cols-3 gap-3">
          <Field className="col-span-1">
            <FieldLabel htmlFor="zipCode">Code Postal</FieldLabel>
            <Input
              id="zipCode"
              type="text"
              placeholder="75001"
              disabled={isLoading}
              {...register("zipCode")}
            />
            {errors.zipCode && (
              <p className="text-xs font-medium text-red-600 mt-1">{errors.zipCode.message}</p>
            )}
          </Field>

          <Field className="col-span-2">
            <FieldLabel htmlFor="city">Ville</FieldLabel>
            <Input
              id="city"
              type="text"
              placeholder="Paris"
              disabled={isLoading}
              {...register("city")}
            />
            {errors.city && (
              <p className="text-xs font-medium text-red-600 mt-1">{errors.city.message}</p>
            )}
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="country">Pays</FieldLabel>
          <Input
            id="country"
            type="text"
            disabled={isLoading}
            {...register("country")}
          />
          {errors.country && (
            <p className="text-xs font-medium text-red-600 mt-1">{errors.country.message}</p>
          )}
        </Field>

        <Field className="pt-2 space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isDefaultDelivery"
              disabled={isLoading}
              className="h-4 w-4 rounded border-gray-300 accent-primary"
              {...register("isDefaultDelivery")}
            />
            <FieldLabel htmlFor="isDefaultDelivery" className="text-xs select-none">
              Par défaut (Livraison)
            </FieldLabel>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isDefaultBilling"
              disabled={isLoading}
              className="h-4 w-4 rounded border-gray-300 accent-primary"
              {...register("isDefaultBilling")}
            />
            <FieldLabel htmlFor="isDefaultBilling" className="text-xs select-none">
              Par défaut (Facturation)
            </FieldLabel>
          </div>
        </Field>

        <div className="flex justify-end gap-2 pt-4 border-t mt-4">
          <Button type="button" variant="outline" onClick={onCancelEdit} disabled={isLoading}>
            Annuler
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
            {isEditing ? "Enregistrer les modifications" : "Enregistrer l'adresse"}
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}