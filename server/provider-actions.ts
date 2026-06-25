"use server"

import { providerSchema } from "@/lib/schemas/provider"
import { getCurrentUserAction } from "./user-actions"
import { db } from "@/db/drizzle"
import { products, providers } from "@/db/schema"
import { revalidatePath } from "next/cache"
import { eq, and, ne, ilike, or } from "drizzle-orm"

const ensureAdmin = async () => {
  const session = await getCurrentUserAction()
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Action non autorisée. Droits d'administrateur requis.")
  }
  return session
}

export const createProviderAction = async (formData: {
  name: string; 
  refProvider: string;
}) => {
  try {
    await ensureAdmin()
    const validatedData = providerSchema.parse(formData)
    const upperRef = validatedData.refProvider.toUpperCase()

    const existingProvider = await db.query.providers.findFirst({
      where: (providers, { or, eq }) => or(
        eq(providers.refProvider, upperRef),
        eq(providers.name, validatedData.name)
      )
    })

    if (existingProvider) {
      if (existingProvider.refProvider === upperRef) {
        throw new Error(`La référence fournisseur "${upperRef}" est déjà utilisée.`)
      }
      if (existingProvider.name === validatedData.name) {
        throw new Error(`Un fournisseur nommé "${validatedData.name}" existe déjà.`)
      }
    }

    await db.insert(providers).values({
      name: validatedData.name,
      refProvider: upperRef
    })

    revalidatePath("/admin/fournisseurs")

    return {
      success: true,
      message: "Fournisseur créé avec succès !"
    }
  } catch (error) {
    const e = error as Error
    console.error("Error creating provider:", error)
    return {
      success: false,
      message: e.message || "Impossible de créer le fournisseur."
    }
  }
}

export const updateProviderAction = async (id: string, formData: {
  name: string; 
  refProvider: string;
}) => {
  try {
    await ensureAdmin()
    const validatedData = providerSchema.parse(formData)
    const upperRef = validatedData.refProvider.toUpperCase()

    const conflictingProvider = await db.query.providers.findFirst({
      where: (providers, { and, ne, or, eq }) => and(
        ne(providers.id, id),
        or(
          eq(providers.refProvider, upperRef),
          eq(providers.name, validatedData.name)
        )
      )
    })

    if (conflictingProvider) {
      if (conflictingProvider.refProvider === upperRef) {
        throw new Error(`La référence "${upperRef}" est déjà attribuée à un autre fournisseur.`)
      }
      if (conflictingProvider.name === validatedData.name) {
        throw new Error(`Le nom "${validatedData.name}" est déjà utilisé par un autre fournisseur.`)
      }
    }

    await db.update(providers).set({
      name: validatedData.name,
      refProvider: upperRef
    })
    .where(eq(providers.id, id))

    revalidatePath("/admin/fournisseurs")

    return {
      success: true,
      message: "Fournisseur mis à jour avec succès !"
    }
  } catch (error) {
    const e = error as Error
    console.error("Error updating provider:", error)
    return {
      success: false,
      message: e.message || "Impossible de mettre à jour le fournisseur."
    }
  }
}

export async function getProvidersLookupAction() {
  try {
    const session = await getCurrentUserAction();
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "COMMERCIAL")) {
      throw new Error("Action non autorisée.");
    }

    const list = await db.query.providers.findMany({
      columns: {
        id: true,
        name: true,
      },
      orderBy: (providers, { asc }) => [asc(providers.name)],
    });

    return { success: true, data: list };
  } catch (error) {
    console.error("Error fetching providers lookup:", error);
    return { success: false, data: [], message: "Impossible de charger le référentiel." };
  }
}


export async function getProviderByIdAction(id: string) {
  try {
    const session = await getCurrentUserAction();
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "COMMERCIAL")) {
      throw new Error("Action non autorisée.");
    }

    if (!id) {
      throw new Error("L'identifiant du fournisseur est requis.");
    }

    const provider = await db.query.providers.findFirst({
      where: (providers, { eq }) => eq(providers.id, id),
      with : {
        products :{
            orderBy : (products, {desc}) => [desc(products.createdAt)]
        }
      }
    });

    if (!provider) {
      return { success: false, data: null, message: "Fournisseur introuvable." };
    }

    return { success: true, data: provider };
  } catch (error) {
    const e = error as Error;
    console.error(`Error fetching provider with id ${id}:`, error);
    return { success: false, data: null, message: e.message || "Impossible de récupérer le fournisseur." };
  }
}


export async function searchProvidersAction(searchParam?: string) {
  try {
    const session = await getCurrentUserAction();
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "COMMERCIAL")) {
      throw new Error("Action non autorisée.");
    }

    if (!searchParam || searchParam.trim() === "") {
      const defaultList = await db.query.providers.findMany({
        limit: 20,
        orderBy: (providers, { asc }) => [asc(providers.name)],
      });
      return { success: true, data: defaultList };
    }

    const queryTerm = `%${searchParam.trim()}%`;

    // Recherche insensible à la casse sur le nom OU sur la référence
    const searchResults = await db.query.providers.findMany({
      where: (providers) => or(
        ilike(providers.name, queryTerm),
        ilike(providers.refProvider, queryTerm)
      ),
      orderBy: (providers, { asc }) => [asc(providers.name)],
      limit: 50, // Sécurité pour éviter de surcharger le payload du réseau
    });

    return { success: true, data: searchResults };
  } catch (error) {
    console.error("Error searching providers:", error);
    return { success: false, data: [], message: "Impossible d'effectuer la recherche." };
  }
}


export const deleteProviderAction = async (id: string) => {
  try {
    await ensureAdmin()

    if (!id) {
      throw new Error("L'identifiant du fournisseur est requis.")
    }

    // 1. Vérification optionnelle mais recommandée pour être proactif sur l'UX
    const linkedProduct = await db.query.products.findFirst({
      where: (products, { eq }) => eq(products.providerId, id),
    })

    if (linkedProduct) {
      throw new Error(
        "Impossible de supprimer ce fournisseur car des produits lui sont encore associés dans le catalogue."
      )
    }

    // 2. Suppression effective
    await db.delete(providers).where(eq(providers.id, id))

    // 3. Revalidation du cache de la page de la liste
    revalidatePath("/admin/fournisseurs")

    return {
      success: true,
      message: "Fournisseur supprimé avec succès !"
    }
  } catch (error) {
    const e = error as Error
    console.error(`Error deleting provider with id ${id}:`, error)

    // Gestion de l'erreur PostgreSQL si jamais la vérification amont a été court-circuitée (race condition)
    if (e.message.includes("foreign key constraint") || e.message.includes("violates foreign key")) {
      return {
        success: false,
        message: "Suppression impossible : ce fournisseur est lié à des produits existants."
      }
    }

    return {
      success: false,
      message: e.message || "Impossible de supprimer le fournisseur."
    }
  }
}