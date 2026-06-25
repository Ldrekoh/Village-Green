"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { KeyRound } from "lucide-react";
import { UpdatePasswordForm } from "./password-form";

export function PasswordProfileContainer() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex flex-col gap-4 p-6 bg-background rounded-xl border shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-muted-foreground" />
            Mot de passe et Sécurité
          </h3>
          <p className="text-sm text-muted-foreground">
            Mettez à jour votre mot de passe pour sécuriser votre compte.
          </p>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">Modifier le mot de passe</Button>
          </DialogTrigger>
          
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Modifier le mot de passe</DialogTitle>
              <DialogDescription>
                Pour des raisons de sécurité, veuillez saisir votre mot de passe actuel.
              </DialogDescription>
            </DialogHeader>

            {/* Imbrication du formulaire */}
            <UpdatePasswordForm onSuccess={() => setIsOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}