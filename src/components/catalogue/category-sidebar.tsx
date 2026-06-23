"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

// Représente la structure d'une catégorie avec ses enfants (générée par ton Server Action)
interface CategoryNode {
  id: string;
  name: string;
  parentId: string | null;
  children?: CategoryNode[];
}

interface CategorySidebarProps {
  categories: CategoryNode[];
}

export function CategorySidebar({ categories }: CategorySidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("category");

  // Met à jour l'URL avec la catégorie sélectionnée
  const handleCategoryClick = (id: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (id) {
      params.set("category", id);
    } else {
      params.delete("category"); // Si null, on réinitialise pour afficher "Tous les produits"
    }
    
    // Règle d'or UX : on reset toujours la page à 1 quand on change de filtre
    params.delete("page"); 
    
    router.push(`/catalogue?${params.toString()}`);
  };

  return (
    <aside className="w-full md:w-64 flex flex-col gap-4 border-b md:border-b-0 md:border-r pb-4 md:pb-0 md:pr-6 shrink-0">
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
          Filtrer par catégorie
        </h2>
        
        {/* Bouton global pour réinitialiser le filtre */}
        <button
          onClick={() => handleCategoryClick(null)}
          className={cn(
            "w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-muted font-medium transition-colors",
            !currentCategory 
              ? "bg-primary text-primary-foreground hover:bg-primary/90" 
              : "text-foreground"
          )}
        >
          Tous les produits
        </button>

        {/* Liste des catégories principales et leurs sous-catégories */}
        <div className="flex flex-col gap-4 mt-2">
          {categories.map((parent) => (
            <div key={parent.id} className="flex flex-col gap-1">
              {/* Titre de la catégorie parente (ex: Guitares, Amplificateurs) */}
              <span className="px-3 text-xs font-bold text-foreground/70 tracking-wide">
                {parent.name}
              </span>
              
              {/* Liste de ses sous-catégories enfants */}
              {parent.children && parent.children.length > 0 && (
                <ul className="flex flex-col gap-0.5 pl-2 border-l ml-3 mt-1">
                  {parent.children.map((child) => (
                    <li key={child.id}>
                      <button
                        onClick={() => handleCategoryClick(child.id)}
                        className={cn(
                          "w-full text-left px-3 py-1.5 text-sm rounded-md hover:bg-muted transition-colors",
                          currentCategory === child.id 
                            ? "bg-muted font-semibold text-primary" 
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {child.name}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}