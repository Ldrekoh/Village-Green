import * as z from "zod";

export const providerSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Le nom du fournisseur doit contenir au moins 2 caractères." })
    .max(100, { message: "Le nom du fournisseur est trop long." }),
  refProvider: z
    .string()
    .min(3, { message: "La référence doit contenir au moins 3 caractères." })
    .max(50, { message: "La référence ne doit pas dépasser 50 caractères." })
    // .regex(/^[A-Z0-9-]+$/, { 
    //   message: "La référence ne doit contenir que des lettres majuscules, chiffres et tirets (ex: FOURN-01)." 
    // }),
});

export type ProviderValues = z.infer<typeof providerSchema>;