"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Building2, Pencil, Plus } from "lucide-react";

import { ProviderForm } from "./provider-form";
import { DeleteProviderButton } from "./delete-provider-button";
import { SearchProviderInput } from "./search-provider-input";
import Link from "next/link";

interface ProviderItem {
  id: string;
  name: string;
  refProvider: string;
}

interface ProvidersClientContainerProps {
  initialProviders: ProviderItem[];
}

export function ProvidersClientContainer({ initialProviders }: ProvidersClientContainerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<ProviderItem | null>(null);
  
  // State pour gérer la liste courante affichée (filtrée ou non)
  const [filteredProviders, setFilteredProviders] = useState<ProviderItem[]>(initialProviders);
  const [isSearching, setIsSearching] = useState(false);
  const [currentQuery, setCurrentQuery] = useState("");

  // Synchronise le state local lorsque les données serveur changent (revalidatePath après ADD/UPDATE/DELETE)
  useEffect(() => {
    if (!isSearching || !currentQuery.trim()) {
      setFilteredProviders(initialProviders);
    } else {
      // Si une recherche est en cours, on réapplique le filtre sur les nouvelles données fraîches du serveur
      const normalizedQuery = currentQuery.trim().toLowerCase();
      const freshlyFiltered = initialProviders.filter(
        (prov) =>
          prov.name.toLowerCase().includes(normalizedQuery) ||
          prov.refProvider.toLowerCase().includes(normalizedQuery)
      );
      setFilteredProviders(freshlyFiltered);
    }
  }, [initialProviders, isSearching, currentQuery]);

  const handleStartEdit = (provider: ProviderItem) => {
    setEditingProvider(provider);
    setIsOpen(true);
  };

  const handleStartAdd = () => {
    setEditingProvider(null);
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setEditingProvider(null);
  };

  const handleSearchResults = (results: ProviderItem[], query: string) => {
    setIsSearching(true);
    setCurrentQuery(query);
    setFilteredProviders(results);
  };

  const handleClearSearch = () => {
    setIsSearching(false);
    setCurrentQuery("");
    setFilteredProviders(initialProviders);
  };

  return (
    <div className="md:col-span-3 space-y-6">
      {/* Barre d'outils supérieure */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-muted/40 p-4 rounded-xl border gap-4">
        <div>
          <h2 className="text-lg font-semibold">Référentiel Fournisseurs</h2>
          <p className="text-xs text-muted-foreground">Gérez les constructeurs et fournisseurs requis pour le catalogue produits.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Barre de recherche débourcée */}
          <SearchProviderInput 
            onSearchResults={(results, query) => handleSearchResults(results, query)} 
            onClear={handleClearSearch} 
          />

          {/* Modal Unique Création / Édition */}
          <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
            <DialogTrigger asChild>
              <Button onClick={handleStartAdd} className="gap-2">
                <Plus className="h-4 w-4" /> Nouveau fournisseur
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingProvider ? "Modifier le fournisseur" : "Nouveau fournisseur"}
                </DialogTitle>
                <DialogDescription>
                  {editingProvider ? "Modifiez les informations du fournisseur sélectionné." : "Ajoutez un nouveau fournisseur à votre référentiel métier."}
                </DialogDescription>
              </DialogHeader>

              <ProviderForm editingProvider={editingProvider} onCancelEdit={handleClose} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Rendu des résultats ou de la vue vide */}
      {filteredProviders.length === 0 ? (
        <Card className="border-dashed flex flex-col items-center justify-center text-center p-8 h-[240px]">
          <CardContent className="text-muted-foreground text-sm p-0">
            <Building2 className="mx-auto h-8 w-8 text-muted-foreground/30 mb-3" />
            {isSearching 
              ? "Aucun fournisseur ne correspond à votre recherche." 
              : "Aucun fournisseur enregistré pour le moment."
            }
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProviders.map((prov) => (
            <Card key={prov.id} className="flex flex-col justify-between min-h-[160px] shadow-sm">
              <Link 
                href={`/admin/fournisseurs/${prov.id}`}
                className="flex-1 flex flex-col justify-between focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:rounded-t-lg"
              >
                <CardHeader className="pb-2 space-y-1">
                  <CardTitle className="text-base font-semibold pt-1 line-clamp-1">{prov.name}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground flex-1">
                  <p className="text-xs text-muted-foreground uppercase font-mono tracking-wider">
                    Réf: <span className="text-foreground font-medium">{prov.refProvider}</span>
                  </p>
                </CardContent>
              </Link>
              <CardFooter className="border-t bg-muted/20 pt-3 pb-3 flex justify-between items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1 text-xs"
                  onClick={() => handleStartEdit(prov)}
                >
                  <Pencil className="h-3 w-3" />
                  Modifier
                </Button>
                <DeleteProviderButton providerId={prov.id} />
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}