import { notFound } from "next/navigation";
import { getProductByIdAction } from "@/server/catalogue-actions";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { id } = await params;
  const { data: product } = await getProductByIdAction(id);

  // Si le produit n'existe pas ou est inactif
  if (!product || !product.isActive) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/catalogue" className="text-sm text-muted-foreground hover:underline">
          ← Retour au catalogue
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-card border rounded-xl p-6 shadow-sm">
        {/* Visuel Produit */}
        <div className="aspect-square bg-muted rounded-lg overflow-hidden">
          <img
            src={product.photoUrl || "/placeholder.svg"}
            alt={product.labelShort}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Métadonnées & Achat */}
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-xs font-semibold uppercase text-primary tracking-wider">
              {product.category?.name}
            </p>
            <h1 className="text-3xl font-bold mt-1">{product.labelShort}</h1>
            <p className="text-sm text-muted-foreground mt-1">Réf: {product.providerRef}</p>
          </div>

          <div className="border-t border-b py-4 my-2">
            <p className="text-3xl font-bold text-primary">
              {parseFloat(product.priceBuyHt).toFixed(2)} € <span className="text-sm font-normal text-muted-foreground">HT</span>
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Soit {(parseFloat(product.priceBuyHt) * (1 + parseFloat(product.vatRate) / 100)).toFixed(2)} € TTC (TVA {parseFloat(product.vatRate)}%)
            </p>
          </div>

          <div>
            <h2 className="font-semibold text-lg">Description</h2>
            <p className="text-muted-foreground text-sm leading-relaxed mt-1 whitespace-pre-line">
              {product.labelLong}
            </p>
          </div>

          <div className="mt-auto pt-6">
            {product.stockQuantity > 0 ? (
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-green-600">
                  ✔ En stock ({product.stockQuantity} unités disponibles)
                </span>
                <Button size="lg" className="w-full sm:w-auto">
                  Ajouter au panier
                </Button>
              </div>
            ) : (
              <Button size="lg" variant="outline" disabled className="w-full sm:w-auto">
                Rupture de stock
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}