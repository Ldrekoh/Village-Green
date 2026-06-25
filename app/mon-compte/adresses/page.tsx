import { db } from "@/db/drizzle";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUserAction } from "@/server/user-actions";
import { User, MapPin } from "lucide-react";
import type { AddressItem } from "@/db/schema";

// Import de ton composant client interactif
import { AddressesClientContainer } from "@/components/profile/address/addresses-client-container";

export default async function AddressesPage() {
  // 1. On sécurise la page côté serveur
  const session = await getCurrentUserAction();
  if (!session) redirect("/login");

  // 2. On fetch les données fraîches depuis Drizzle
  const userData = await db.query.user.findFirst({
    where: eq(user.id, session.user.id),
  });

  const savedAddresses = (userData?.savedAddresses as AddressItem[]) || [];

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Mon carnet d'adresses</h1>
        <p className="text-muted-foreground">Gérez vos adresses de facturation et de livraison.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
        {/* Barre de navigation latérale de ton compte */}
        <div className="space-y-1">
          <Link href="/mon-compte" className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <User className="h-4 w-4" />
            Mon Profil
          </Link>
          <Link href="/mon-compte/adresses" className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg bg-primary text-primary-foreground">
            <MapPin className="h-4 w-4" />
            Mon carnet d'adresses
          </Link>
        </div>

        {/* 3. On injecte TON composant client qui gère les Modals et le CRUD */}
        <div className="md:col-span-3">
          <AddressesClientContainer savedAddresses={savedAddresses} />
        </div>
      </div>
    </div>
  );
}