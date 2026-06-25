"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { manageUserAddressesAction } from "@/server/profile-actions";

interface DeleteAddressButtonProps {
  addressId: string;
}

export function DeleteAddressButton({ addressId }: DeleteAddressButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await manageUserAddressesAction("DELETE", { addressId });
      if (result.success) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Impossible de supprimer cette adresse.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Button 
      type="button" 
      variant="destructive" 
      size="sm" 
      disabled={isDeleting}
      onClick={handleDelete}
    >
      {isDeleting ? <Loader2 className="size-3 animate-spin mr-1" /> : null}
      Supprimer
    </Button>
  );
}