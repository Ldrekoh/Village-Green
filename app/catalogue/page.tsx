// src/app/catalogue/page.tsx
import { getCategoryTreeAction, getProductsAction } from "@/server/catalogue-actions";
import { CategorySidebar } from "@/components/catalogue/category-sidebar";
import { ProductCard } from "@/components/catalogue/product-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface PageProps {
  searchParams: Promise<{
    search?: string;
    category?: string;
    page?: string;
  }>;
}

export default async function CataloguePage({ searchParams }: PageProps) {
  // Résolution des searchParams (Requis depuis Next.js 15+)
  const resolvedParams = await searchParams;
  const currentPage = Number(resolvedParams.page) || 1;

  // Lancement des requêtes en parallèle sur le serveur (Performance maximale)
  const [categoriesRes, productsRes] = await Promise.all([
    getCategoryTreeAction(),
    getProductsAction({
      search: resolvedParams.search,
      category: resolvedParams.category,
      page: currentPage,
    }),
  ]);

  return (
    <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row gap-8">
      {/* 1. Sidebar de Filtrage par Catégories */}
      <CategorySidebar categories={categoriesRes.data || []} />

      {/* 2. Zone Principale du Catalogue */}
      <div className="flex-1 flex flex-col gap-6">
        
        {/* Barre de recherche native via formulaire HTML (Zéro JS requis au submit) */}
        <form method="GET" action="/catalogue" className="flex gap-2 max-w-md">
          {resolvedParams.category && (
            <input type="hidden" name="category" value={resolvedParams.category} />
          )}
          <Input
            name="search"
            placeholder="Rechercher un modèle de guitare, ampli..."
            defaultValue={resolvedParams.search || ""}
            className="bg-background"
          />
          <Button type="submit">Rechercher</Button>
        </form>

        {/* Grille d'affichage des produits */}
        {productsRes.data.length === 0 ? (
          <div className="text-center py-16 border rounded-xl bg-muted/30 text-muted-foreground">
            <p className="text-lg font-medium">Aucun produit ne correspond à vos critères.</p>
            <p className="text-sm mt-1">Essayez d&apos;élargir votre recherche ou de changer de catégorie.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {productsRes.data.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* 3. Système de Pagination Dynamique */}
        {productsRes.pagination.totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8 border-t pt-6">
            {Array.from({ length: productsRes.pagination.totalPages }).map((_, index) => {
              const pageNum = index + 1;
              const params = new URLSearchParams();
              
              if (resolvedParams.search) params.set("search", resolvedParams.search);
              if (resolvedParams.category) params.set("category", resolvedParams.category);
              params.set("page", pageNum.toString());

              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  asChild
                >
                  <Link href={`/catalogue?${params.toString()}`}>{pageNum}</Link>
                </Button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}