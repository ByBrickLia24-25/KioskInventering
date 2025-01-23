import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogFooter,
  } from "@/components/ui/dialog";
  import { Button } from "./ui/button";
  import { useState } from "react";
  
  interface InventoryDialogProps {
    facility: string;
    kiosk: string;
    inventoryDate: string; // Eller Date om du använder datumobjekt
  }
  
  export function InventoryDialog({
    facility,
    kiosk,
    inventoryDate,
  }: InventoryDialogProps) {
    const [isOpen, setIsOpen] = useState(true); // Hanterar dialogens öppningsstatus
  
    const handleClose = () => {
      setIsOpen(false); // Stänger dialogen
      console.log("Inventering startad"); // Lägg till logik här om nödvändigt
    };
  
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <h2>Kiosk Inventering</h2>
          </DialogHeader>
          <div>
            <h2 className="text-center w-full mb-1 h-fit">
              {facility} {kiosk}
            </h2>
            <p className="text-center text-xs">
              Senast inventering: {inventoryDate}
            </p>
          </div>
          <DialogFooter>
            <Button onClick={handleClose}>Starta inventering</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
  