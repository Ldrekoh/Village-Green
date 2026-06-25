import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUserAction } from "@/server/user-actions";
import { getProviderByIdAction } from "@/server/provider-actions";

interface ProviderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminProviderDetailPage({ params }: ProviderDetailPageProps) {
  const { id } = await params;

  // 1. Sécurité d'affichage de la page
  const session = await getCurrentUserAction();
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "COMMERCIAL")) {
    redirect("/");
  }

  // 2. Récupération des données via ton action (inclut déjà products via 'with')
  const res = await getProviderByIdAction(id);
  
  if (!res.success || !res.data) {
    notFound();
  }

  const provider = res.data;

  return (
    <main className="container mx-auto p-6 max-w-5xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/fournisseurs">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{provider.name}</h1>
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
            Référence : {provider.refProvider}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Package className="h-5 w-5 text-muted-foreground" />
          Produits associés ({provider.products?.length || 0})
        </h2>

        {!provider.products || provider.products.length === 0 ? (
          <Card className="border-dashed flex flex-col items-center justify-center text-center p-8 h-[180px]">
            <CardContent className="text-muted-foreground text-sm p-0">
              Aucun produit n'est actuellement lié à ce fournisseur.
            </CardContent>
          </Card>
        ) : (
          <div className="border rounded-lg bg-card divide-y">
            {provider.products.map((product) => (
              <div key={product.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                <div>
                  <p className="font-medium text-sm">{product.labelShort}</p>
                  <p className="text-xs text-muted-foreground font-mono">Ref Prov: {product.providerRef}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{Number(product.priceBuyHt).toFixed(2)} € HT</p>
                  <p className="text-xs text-muted-foreground">Stock : {product.stockQuantity}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}