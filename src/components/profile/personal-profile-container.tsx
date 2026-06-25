"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { User } from "lucide-react";
import { PersonalProfileForm } from "./personal-form";

interface PersonalProfileContainerProps {
  initialData: {
    name: string;
    email: string;
    image: string | null;
  };
}

export function PersonalProfileContainer({ initialData }: PersonalProfileContainerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex flex-col gap-4 p-6 bg-background rounded-xl border shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <User className="h-5 w-5 text-muted-foreground" />
            Informations Personnelles
          </h3>
          <p className="text-sm text-muted-foreground">
            {initialData.name} ({initialData.email})
          </p>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">Modifier mes infos</Button>
          </DialogTrigger>
          
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Informations Personnelles</DialogTitle>
              <DialogDescription>
                Mettez à jour vos informations de contact et votre photo.
              </DialogDescription>
            </DialogHeader>

            {/* Formulaire injecté directement */}
            <PersonalProfileForm initialData={initialData} onSuccess={() => setIsOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}