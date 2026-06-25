"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import { Search, Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { searchProvidersAction } from "@/server/provider-actions";

interface ProviderItem {
  id: string;
  name: string;
  refProvider: string;
  createdAt: Date;
}

interface SearchProviderInputProps {
  onSearchResults: (results: ProviderItem[], query: string) => void;
  onClear?: () => void;
}

export function SearchProviderInput({ onSearchResults, onClear }: SearchProviderInputProps) {
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  const onSearchResultsRef = useRef(onSearchResults);
  const onClearRef = useRef(onClear);

  useEffect(() => {
    onSearchResultsRef.current = onSearchResults;
    onClearRef.current = onClear;
  }, [onSearchResults, onClear]);

  useEffect(() => {
    if (query === "") {
      onClearRef.current?.();
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      startTransition(async () => {
        const res = await searchProvidersAction(query);
        if (res.success && res.data) {
          onSearchResultsRef.current?.(res.data as ProviderItem[], query);
        }
      });
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleClear = () => {
    setQuery("");
    onClearRef.current?.();
  };

  return (
    <div className="relative w-full max-w-sm">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
      <Input
        type="text"
        aria-label="Rechercher un fournisseur"
        placeholder="Rechercher par nom ou référence..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="pl-9 pr-9"
      />
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
        {isPending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-hidden="true" />}
        {query && !isPending && (
          <button
            type="button"
            aria-label="Effacer la recherche"
            onClick={handleClear}
            className="p-0.5 rounded-sm hover:bg-muted text-muted-foreground transition-colors"
          >
            <X className="h-3 w-3" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}