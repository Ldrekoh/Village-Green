import * as z from "zod";

export const updatePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, { message: "Le mot de passe actuel est requis." }),
    newPassword: z
      .string()
      .min(8, { message: "Le nouveau mot de passe doit contenir au moins 8 caractères." }),
    confirmPassword: z
      .string()
      .min(1, { message: "La confirmation est requise." }),
    revokeOtherSessions: z.boolean(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas.",
    path: ["confirmPassword"],
  });

export const personalProfileSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Le nom doit contenir au moins 2 caractères." }),
  image: z
    .string()
    .or(z.literal("")),
});

export const companyProfileSchema = z.object({
  companyName: z
    .string()
    .min(1, { message: "La raison sociale est requise." }),
  siret: z
    .string()
    .length(14, { message: "Le numéro SIRET doit comporter exactement 14 chiffres." })
    .regex(/^[0-9]+$/, { message: "Le SIRET ne doit contenir que des chiffres." }),
  vatNumber: z
    .string()
    .min(4, { message: "Le numéro de TVA est requis ou invalide." }),
});

export type UpdatePasswordValues = z.infer<typeof updatePasswordSchema>;
export type PersonalProfileValues = z.infer<typeof personalProfileSchema>;
export type CompanyProfileValues = z.infer<typeof companyProfileSchema>;