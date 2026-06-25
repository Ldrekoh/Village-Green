import { db } from "@/db/drizzle";
import { customers } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUserAction } from "@/server/user-actions";
import { User, MapPin, ArrowLeft } from "lucide-react";

// Importation de tes containers qui encapsulent les Dialogs Shadcn

import { CompanyProfileContainer } from "@/components/profile/company-profile-container";
import { PersonalProfileContainer } from "@/components/profile/personal-profile-container";
import { PasswordProfileContainer } from "@/components/profile/password/password-profile-container";

export default async function UpdateProfilePage() {
  const session = await getCurrentUserAction();
  if (!session) redirect("/login");

  const isB2B = session.user.role === "CUSTOMER_B2B";
  let customerInfo = null;

  // Récupération sécurisée des données de l'entreprise si l'utilisateur est B2B
  if (isB2B && session.user.customerId) {
    customerInfo = await db.query.customers.findFirst({
      where: eq(customers.id, session.user.customerId),
    });
  }

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <div className="mb-8">
        <Link
          href="/mon-compte"
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Retour au profil
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">
          Modifier mon profil
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* NAV LATÉRALE */}
        <div className="space-y-2">
          <Link
            href="/mon-compte"
            className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg bg-primary text-primary-foreground"
          >
            <User className="h-4 w-4" />
            Mon Profil
          </Link>
          <Link
            href="/mon-compte/adresses"
            className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <MapPin className="h-4 w-4" />
            Mon carnet d'adresses
          </Link>
        </div>

        {/* COLONNE DES CONTAINERS AVEC MODALS SHADCN */}
        <div className="md:col-span-3 space-y-6">
          {/* Container Personnel (Gère sa propre modal d'édition) */}
          <PersonalProfileContainer
            initialData={{
              name: session.user.name,
              email: session.user.email,
              image: session.user.image || "",
            }}
          />
          <PasswordProfileContainer />
          {/* Container Entreprise (Gère sa propre modal d'édition pour le B2B) */}
          {isB2B && (
            <CompanyProfileContainer
              initialData={
                customerInfo
                  ? {
                      companyName: customerInfo.companyName || "",
                      siret: customerInfo.siret || "",
                      vatNumber: customerInfo.vatNumber || "",
                    }
                  : null
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}
