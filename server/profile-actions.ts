"use server";

import { db } from "@/db/drizzle";
import { auth } from "@/lib/auth";
import { customers, user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import type { AddressItem } from "@/db/schema";
import { getCurrentUserAction } from "./user-actions";


export const updatePasswordProfileAction = async (formData: {
  newPassword: string;
  currentPassword: string;
  revokeOtherSessions: boolean; 
}) => {
  try {
    await auth.api.changePassword({
      body: {
        newPassword: formData.newPassword,
        currentPassword: formData.currentPassword,
        revokeOtherSessions: formData.revokeOtherSessions,
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

    // 2. Fallback pour les erreurs serveurs brutes ou crash réseau
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
    const session = await getCurrentUserAction();

    await auth.api.updateUser({
      headers: await headers(),
      body: { name: formData.name, image: formData.image },
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
    const session = await getCurrentUserAction();
    const currentUser = session.user;

    if (currentUser.role !== "CUSTOMER_B2B") {
      throw new Error("Action non autorisée pour les comptes non-B2B.");
    }

    if (!currentUser.customerId) {
      const customerRef = `VG-B2B-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

      const defaultCommercial = await db.query.commercials.findFirst();
      if (!defaultCommercial) {
        throw new Error(
          "Configuration système : Aucun conseiller commercial disponible pour l'affectation.",
        );
      }

      const [newCustomer] = await db
        .insert(customers)
        .values({
          customerRef,
          type: "PROFESSIONNEL",
          firstName: currentUser.name.split(" ")[0] || "Client",
          lastName: currentUser.name.split(" ")[1] || "Pro",
          email: currentUser.email,
          coefficient: "0.90", // Coefficient par défaut (10% de remise brute)
          commercialId: defaultCommercial.id,
          companyName: formData.companyName,
          siret: formData.siret,
          vatNumber: formData.vatNumber,
        })
        .returning();

      await db
        .update(user)
        .set({ customerId: newCustomer.id })
        .where(eq(user.id, currentUser.id));
    } else {
      await db
        .update(customers)
        .set({
          companyName: formData.companyName,
          siret: formData.siret,
          vatNumber: formData.vatNumber,
        })
        .where(eq(customers.id, currentUser.customerId));
    }

    revalidatePath("/mon-compte");
    return { 
      success: true, 
      message: "Les informations de l'entreprise ont été enregistrées avec succès !" 
    };
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

    const userData = await db.query.user.findFirst({
      where: eq(user.id, session.user.id),
    });
    if (!userData) throw new Error("Compte introuvable.");

    let currentList = (userData.savedAddresses as AddressItem[]) || [];

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

    await db
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
  } catch (error) {
    const e = error as Error;
    console.error("Error managing addresses:", error);
    return {
      success: false,
      message: e.message || "Une erreur est survenue lors de la gestion de vos adresses."
    };
  }
}