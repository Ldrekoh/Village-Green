"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Building2 } from "lucide-react";
import { CompanyProfileForm } from "./company-form";

interface CompanyProfileContainerProps {
  initialData: {
    companyName: string;
    siret: string;
    vatNumber: string;
  } | null;
}

export function CompanyProfileContainer({ initialData }: CompanyProfileContainerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex flex-col gap-4 p-6 bg-background rounded-xl border shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Building2 className="h-5 w-5 text-muted-foreground" />
            Informations Entreprise (B2B)
          </h3>
          <p className="text-sm text-muted-foreground">
            {initialData?.companyName 
              ? `Société enregistrée : ${initialData.companyName}`
              : "Aucune entreprise configurée pour ce compte."}
          </p>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant={initialData?.companyName ? "outline" : "default"}>
              {initialData?.companyName ? "Modifier la société" : "Initialiser l'entreprise"}
            </Button>
          </DialogTrigger>
          
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Informations Entreprise (B2B)</DialogTitle>
              <DialogDescription>
                Mettez à jour ou initialisez les données légales de votre société.
              </DialogDescription>
            </DialogHeader>

            {/* Ton formulaire imbriqué directement */}
            <CompanyProfileForm initialData={initialData} onSuccess={() => setIsOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}