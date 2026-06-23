import Link from "next/link";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ProductCardProps {
  product: {
    id: string;
    labelShort: string;
    priceBuyHt: string;
    vatRate: string;
    photoUrl: string | null;
  };
}

const currencyFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
});

export function ProductCard({ product }: ProductCardProps) {
  const priceHt = Number(product.priceBuyHt);
  const vatRate = Number(product.vatRate);
  const priceTtc = priceHt * (1 + vatRate / 100);

  return (
    <Card className="overflow-hidden flex flex-col h-full group hover:shadow-md transition">
      <div className="relative aspect-square bg-muted">
        <img
          src={product.photoUrl || "/placeholder.svg"}
          alt={product.labelShort}
          className="object-cover w-full h-full group-hover:scale-105 transition duration-300"
        />
      </div>
      <CardContent className="p-4 flex-1 flex flex-col gap-1">
        <h3 className="font-semibold text-lg line-clamp-1">{product.labelShort}</h3>
        
        <div className="flex flex-col mt-1">
          {/* Prix HT */}
          <p className="text-xl font-bold text-primary">
            {currencyFormatter.format(priceHt)}{" "}
            <span className="text-xs text-muted-foreground font-normal">HT</span>
          </p>
          <p className="text-xs text-muted-foreground">
            Soit {currencyFormatter.format(priceTtc)} TTC
          </p>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button asChild className="w-full">
          <Link href={`/catalogue/${product.id}`}>Voir le produit</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}