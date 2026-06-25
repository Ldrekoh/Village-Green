"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteProviderAction } from "@/server/provider-actions";

interface DeleteProviderButtonProps {
  providerId: string;
}

export function DeleteProviderButton({ providerId }: DeleteProviderButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    // Confirmation native simple avant action destructive
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce fournisseur ?")) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await deleteProviderAction(providerId);

      if (res.success) {
        toast.success(res.message);
        router.refresh();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Une erreur inattendue est survenue.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="h-8 gap-1 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
      disabled={isDeleting}
      onClick={handleDelete}
    >
      {isDeleting ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <Trash2 className="h-3 w-3" />
      )}
      Supprimer
    </Button>
  );
}