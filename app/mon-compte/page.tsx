import { db } from "@/db/drizzle";
import { customers } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, MapPin, Pencil } from "lucide-react";
import { getCurrentUserAction } from "@/server/user-actions";

export default async function ProfileDashboardPage() {
  const session = await getCurrentUserAction();
  if (!session) redirect("/login");

  const isB2B = session.user.role === "CUSTOMER_B2B";
  let customerInfo = null;

  if (isB2B && session.user.customerId) {
    customerInfo = await db.query.customers.findFirst({
      where: eq(customers.id, session.user.customerId),
    });
  }

  // Initiales pour le fallback de l'avatar
  const initials = session.user.name ? session.user.name.split(" ").map((n) => n[0]).join("").toUpperCase() : "U";

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Mon Espace Client</h1>
        <p className="text-muted-foreground">Consultez vos informations et gérez votre compte.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* NAV LATÉRALE */}
        <div className="space-y-2">
          <Link href="/mon-compte" className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg bg-primary text-primary-foreground">
            <User className="h-4 w-4" />
            Mon Profil
          </Link>
          <Link href="/mon-compte/adresses" className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <MapPin className="h-4 w-4" />
            Mon carnet d'adresses
          </Link>
        </div>

        {/* CONTENU PRINCIPAL */}
        <div className="md:col-span-3 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle>Informations Personnelles</CardTitle>
                <CardDescription>Données générales de votre compte de connexion.</CardDescription>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/mon-compte/update" className="flex items-center gap-2">
                  <Pencil className="h-3.5 w-3.5" />
                  Modifier
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4 border-b pb-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={session.user.image || undefined} alt={session.user.name} />
                  <AvatarFallback className="text-lg">{initials}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">{session.user.name}</h3>
                  <Badge variant={isB2B ? "default" : "secondary"} className="mt-1">
                    {isB2B ? "Professionnel (B2B)" : "Particulier (B2C)"}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-muted-foreground block font-medium uppercase tracking-wider">Nom Complet</span>
                  <span className="text-sm font-semibold">{session.user.name}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block font-medium uppercase tracking-wider">Adresse Email</span>
                  <span className="text-sm font-semibold">{session.user.email}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* RÉCAPITULATIF B2B */}
          {isB2B && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div>
                  <CardTitle>Informations Entreprise</CardTitle>
                  <CardDescription>Vos identifiants professionnels enregistrés pour Village Green.</CardDescription>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href="/mon-compte/update" className="flex items-center gap-2">
                    <Pencil className="h-3.5 w-3.5" />
                    Modifier
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <span className="text-xs text-muted-foreground block font-medium uppercase tracking-wider">Raison Sociale</span>
                  <span className="text-sm font-semibold">{customerInfo?.companyName || "Non renseignée"}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block font-medium uppercase tracking-wider">SIRET</span>
                  <span className="text-sm font-semibold">{customerInfo?.siret || "Non renseigné"}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block font-medium uppercase tracking-wider">N° de TVA</span>
                  <span className="text-sm font-semibold">{customerInfo?.vatNumber || "Non renseigné"}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}