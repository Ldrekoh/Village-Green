import * as z from "zod";

export const addressSchema = z.object({
  street: z
    .string()
    .min(5, { message: "L'adresse doit contenir au moins 5 caractères." }),
  complement: z.string().optional(),
  zipCode: z
    .string()
    .min(3, { message: "Le code postal est trop court." }),
  city: z
    .string()
    .min(2, { message: "La ville doit contenir au moins 2 caractères." }),
  country: z
    .string()
    .min(2, { message: "Le pays doit contenir au moins 2 caractères." }),
  isDefaultDelivery: z.boolean(),
  isDefaultBilling: z.boolean(),
});

export type AddressFormValues = z.infer<typeof addressSchema>;