"use client";

import { useState, useEffect, useTransition } from "react";
import { Search, Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { searchProvidersAction } from "@/server/provider-actions";

interface SearchProviderInputProps {
  onSearchResults: (results: any[]) => void;
  onClear?: () => void;
}

export function SearchProviderInput({ onSearchResults, onClear }: SearchProviderInputProps) {
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    // Évite de lancer une recherche au tout premier rendu à vide
    if (query === "") {
      onClear?.();
      return;
    }

    // Debounce de 300ms : on attend que l'utilisateur arrête de taper
    const delayDebounceFn = setTimeout(() => {
      startTransition(async () => {
        const res = await searchProvidersAction(query);
        if (res.success) {
          onSearchResults(res.data);
        }
      });
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query, onSearchResults, onClear]);

  const handleClear = () => {
    setQuery("");
    onClear?.();
  };

  return (
    <div className="relative w-full max-w-sm">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="text"
        placeholder="Rechercher par nom ou référence..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="pl-9 pr-9"
      />
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
        {isPending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        {query && !isPending && (
          <button
            type="button"
            onClick={handleClear}
            className="p-0.5 rounded-sm hover:bg-muted text-muted-foreground transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}