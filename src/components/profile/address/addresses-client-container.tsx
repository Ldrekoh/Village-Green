"use client";

import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MapPin, Pencil, Plus } from "lucide-react";
import type { AddressItem } from "@/db/schema";

import { AddressForm } from "./address-form";
import { DeleteAddressButton } from "./delete-address-button";

interface AddressesClientContainerProps {
  savedAddresses: AddressItem[];
}

export function AddressesClientContainer({ savedAddresses }: AddressesClientContainerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<AddressItem | null>(null);

  const handleStartEdit = (address: AddressItem) => {
    setEditingAddress(address);
    setIsOpen(true);
  };

  const handleStartAdd = () => {
    setEditingAddress(null);
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setEditingAddress(null);
  };

  return (
    <div className="md:col-span-3 space-y-6">
      <div className="flex justify-between items-center bg-muted/40 p-4 rounded-xl border">
        <div>
          <h2 className="text-lg font-semibold">Vos adresses enregistrées</h2>
          <p className="text-xs text-muted-foreground">Gérez vos adresses de facturation et de livraison.</p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
          <DialogTrigger asChild>
            <Button onClick={handleStartAdd} className="gap-2">
              <Plus className="h-4 w-4" /> Nouvelle adresse
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingAddress ? "Modifier l'adresse" : "Nouvelle adresse"}
              </DialogTitle>
              <DialogDescription>
                {editingAddress ? "Modifiez les champs de l'adresse sélectionnée." : "Ajoutez une destination à votre compte."}
              </DialogDescription>
            </DialogHeader>


            <AddressForm editingAddress={editingAddress} onCancelEdit={handleClose} />

          </DialogContent>
        </Dialog>
      </div>

      {savedAddresses.length === 0 ? (
        <Card className="border-dashed flex flex-col items-center justify-center text-center p-8 h-[240px]">
          <CardContent className="text-muted-foreground text-sm p-0">
            <MapPin className="mx-auto h-8 w-8 text-muted-foreground/30 mb-3" />
            Aucune adresse enregistrée pour le moment.
          </CardContent>
        </Card>
      ) : (
        <div className="grid  gap-4">
          {savedAddresses.map((addr) => (
            <Card key={addr.id} className="flex flex-col justify-between min-h-[180px] shadow-sm">
              <CardHeader className="pb-2 space-y-1">
                <div className="flex flex-wrap gap-1">
                  {addr.isDefaultDelivery && <Badge variant="default" className="text-[10px] px-2 py-0">Livraison</Badge>}
                  {addr.isDefaultBilling && <Badge variant="secondary" className="text-[10px] px-2 py-0">Facturation</Badge>}
                </div>
                <CardTitle className="text-base font-semibold pt-1">{addr.city}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground flex-1">
                <p className="text-foreground font-medium">{addr.street}</p>
                {addr.complement && <p className="text-xs italic">{addr.complement}</p>}
                <p className="text-xs mt-1">{addr.zipCode} - <span className="uppercase font-semibold">{addr.country}</span></p>
              </CardContent>
              <CardFooter className="border-t bg-muted/20 pt-3 pb-3 flex justify-between items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1 text-xs"
                  onClick={() => handleStartEdit(addr)}
                >
                  <Pencil className="h-3 w-3" />
                  Modifier
                </Button>
                <DeleteAddressButton addressId={addr.id} />
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}