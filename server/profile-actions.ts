"use server";

import { db } from "@/db/drizzle";
import { auth } from "@/lib/auth";
import { customers, user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import type { AddressItem } from "@/db/schema";
import { getCurrentUserAction } from "./user-actions";
import { personalProfileSchema, updatePasswordSchema, companyProfileSchema } from "@/lib/schemas/profile";

export const updatePasswordProfileAction = async (formData: {
  newPassword: string;
  currentPassword: string;
  confirmPassword : string;
  revokeOtherSessions: boolean; 
}) => {
  try {
    const validatedData = updatePasswordSchema.parse(formData);

    await auth.api.changePassword({
      body: {
        newPassword: validatedData.newPassword,
        currentPassword: validatedData.currentPassword,
        revokeOtherSessions: validatedData.revokeOtherSessions,
      },
      headers: await headers(),
    });

    return {
      success: true,
      message: "Votre mot de passe a été modifié avec succès !",
    };
  } catch (error: any) {
    if (error && typeof error === "object" && "body" in error) {
      const errorBody = error.body;
      
      if (errorBody?.code === "INVALID_PASSWORD" || errorBody?.message?.includes("current password")) {
        return {
          success: false,
          message: "Le mot de passe actuel est incorrect.",
        };
      }
      
      if (errorBody?.message) {
        return {
          success: false,
          message: errorBody.message,
        };
      }
    }

    console.error("Erreur changePassword:", error);
    return {
      success: false,
      message: "Impossible de modifier le mot de passe. Vérifiez vos informations.",
    };
  }
};

export async function updatePersonalProfileAction(formData: {
  name: string;
  image: string;
}) {
  try {
    const validatedData = personalProfileSchema.parse(formData);
    const session = await getCurrentUserAction();

    await auth.api.updateUser({
      headers: await headers(),
      body: { name: validatedData.name, image: validatedData.image },
    });

    revalidatePath("/mon-compte");
    return { 
      success: true,
      message: "Votre profil a été mis à jour avec succès !" 
    };
  } catch (error) {
    const e = error as Error;
    console.error("Error updating personal profile:", error);
    return {
      success: false,
      message: e.message || "Une erreur est survenue lors de la mise à jour du profil !"
    };
  }
}

export async function updateCompanyProfileAction(formData: {
  companyName: string;
  siret: string;
  vatNumber: string;
}) {
  try {
    const validatedData = companyProfileSchema.parse(formData);

    const session = await getCurrentUserAction();
    const currentUser = session.user;

    if (currentUser.role !== "CUSTOMER_B2B") {
      throw new Error("Action non autorisée pour les comptes non-B2B.");
    }

    return await db.transaction(async (tx) => {
      // 1. On récupère et on verrouille l'utilisateur courant
      const [freshUser] = await tx
        .select()
        .from(user)
        .where(eq(user.id, currentUser.id))
        .for("update");

      if (!freshUser) {
        throw new Error("Utilisateur introuvable.");
      }

      if (!freshUser.customerId) {
        const uniqueSuffix = crypto.randomUUID().split("-")[0].toUpperCase();
        const customerRef = `VG-B2B-${new Date().getFullYear()}-${uniqueSuffix}`;

        const defaultCommercial = await tx.query.commercials.findFirst();
        if (!defaultCommercial) {
          throw new Error("Configuration système : Aucun conseiller commercial disponible.");
        }

        // 2. Gestion propre du conflit d'email via ON CONFLICT DO UPDATE
        const [newCustomer] = await tx
          .insert(customers)
          .values({
            customerRef,
            type: "PROFESSIONNEL",
            firstName: freshUser.name.split(" ")[0] || "Client",
            lastName: freshUser.name.split(" ")[1] || "Pro",
            email: freshUser.email,
            coefficient: "0.90",
            commercialId: defaultCommercial.id,
            companyName: validatedData.companyName,
            siret: validatedData.siret,
            vatNumber: validatedData.vatNumber,
          })
          .onConflictDoUpdate({
            target: customers.email, // Si l'email est déjà là
            set: {
              companyName: validatedData.companyName,
              siret: validatedData.siret,
              vatNumber: validatedData.vatNumber,
            },
          })
          .returning();

        // 3. Liaison de l'ID (que le client vienne d'être créé ou qu'il existait déjà en DB)
        await tx
          .update(user)
          .set({ customerId: newCustomer.id })
          .where(eq(user.id, freshUser.id));

      } else {
        // Mode modification classique si le customerId était déjà lié au compte
        await tx
          .update(customers)
          .set({
            companyName: validatedData.companyName,
            siret: validatedData.siret,
            vatNumber: validatedData.vatNumber,
          })
          .where(eq(customers.id, freshUser.customerId));
      }

      revalidatePath("/mon-compte");
      
      return { 
        success: true, 
        message: "Les informations de l'entreprise ont été enregistrées avec succès !" 
      };
    });

  } catch (error) {
    const e = error as Error;
    console.error("Error updating company profile:", error);
    return {
      success: false,
      message: e.message || "Impossible de mettre à jour les données de l'entreprise."
    };
  }
}

export async function manageUserAddressesAction(
  intent: "ADD" | "DELETE" | "UPDATE", 
  payload: { addressId: string; addressData?: Omit<AddressItem, "id"> },
) {
  try {
    const session = await getCurrentUserAction();

    // 1. Début de la transaction avec verrouillage exclusif
    return await db.transaction(async (tx) => {
      
      // Lecture et verrouillage de la ligne utilisateur (FOR UPDATE)
      const [userData] = await tx
        .select()
        .from(user)
        .where(eq(user.id, session.user.id))
        .for("update");

      if (!userData) throw new Error("Compte introuvable.");

      let currentList = (userData.savedAddresses as AddressItem[]) || [];

      // 2. Application de la logique de modification/suppression/création
      if (intent === "DELETE") {
        currentList = currentList.filter((addr) => addr.id !== payload.addressId);
        if (currentList.length > 0) {
          if (!currentList.some((a) => a.isDefaultDelivery))
            currentList[0].isDefaultDelivery = true;
          if (!currentList.some((a) => a.isDefaultBilling))
            currentList[0].isDefaultBilling = true;
        }
      } else {
        if (!payload.addressData)
          throw new Error("Données de l'adresse manquantes.");
        const data = payload.addressData;

        if (data.isDefaultDelivery) {
          currentList = currentList.map((a) => ({ ...a, isDefaultDelivery: false }));
        }
        if (data.isDefaultBilling) {
          currentList = currentList.map((a) => ({ ...a, isDefaultBilling: false }));
        }

        if (intent === "UPDATE") {
          currentList = currentList.map((addr) =>
            addr.id === payload.addressId ? { ...data, id: payload.addressId } : addr
          );
        } else {
          const newItem: AddressItem = { ...data, id: payload.addressId };
          currentList.push(newItem);
        }
      }

      // 3. Persistance au sein de la transaction
      await tx
        .update(user)
        .set({ savedAddresses: currentList })
        .where(eq(user.id, session.user.id));
        
      revalidatePath("/mon-compte/adresses");
      
      let successMessage = "Adresse ajoutée avec succès !";
      if (intent === "DELETE") successMessage = "Adresse supprimée avec succès !";
      if (intent === "UPDATE") successMessage = "Adresse modifiée avec succès !";

      return { 
        success: true, 
        message: successMessage 
      };
    });

  } catch (error) {
    const e = error as Error;
    console.error("Error managing addresses:", error);
    return {
      success: false,
      message: e.message || "Une erreur est survenue lors de la gestion de vos adresses."
    };
  }
}