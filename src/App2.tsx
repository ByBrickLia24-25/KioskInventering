import { useEffect, useState } from "react";
import Keypad, { KeypadKeys } from "./components/Keypad";
import { Input } from "./components/ui/input";
import { Button } from "./components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { toast } from "./hooks/use-toast";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  Form,
} from "@/components/ui/form";
import { Toaster } from "./components/ui/toaster";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

type KioskInventory = {
  id: number;
  products: Products[];
};

interface Products {
  id: number;
  productName: string;
  amountPieces: number;
  amountPackages: number;
}

const App2 = () => {
  const [currentProductIndex, setCurrentProductIndex] = useState(0);
  const [keypadTarget, setKeypadTarget] = useState<"pieces" | "packages">(
    "pieces"
  );
  const [products, setProducts] = useState<Products[]>([]);

  const id = "3395";

  const { data, isLoading, error } = useQuery<Products[]>({
    queryKey: ["inventoryList"],
    queryFn: async () => {
      const response = await fetch(`http://localhost:3000/inventoryList/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }
      const data: KioskInventory = await response.json();
      return data.products;
    },
  });
  
  useEffect(() => {
    if (data) setProducts(data);
  }, [data]);

  const handleSubmit = async () => {
    try {
      const url = `http://localhost:3000/inventoryList/${id}`;
      const response = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products }), // Skickar den modifierade listan
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Server response error:", errorText);
        throw new Error("Failed to update list");
      }

    } catch (error) {
      console.error("Update failed:", error);
      alert("Misslyckades med att spara ändringar.");
    }
  };

  const handleKeypadPress = (keyPadKey: KeypadKeys) => {
    if (!products.length) return;

    const currentProduct = products[currentProductIndex];

    if (keyPadKey === KeypadKeys.CLEAR) {
      updateCurrentProduct(keypadTarget, "");
      return;
    }

    if (keyPadKey === KeypadKeys.BKSP) {
      updateCurrentProduct(keypadTarget, (prevValue) => prevValue.slice(0, -1));
      return;
    }

    updateCurrentProduct(keypadTarget, (prevValue) => prevValue + keyPadKey);
  };

  const updateCurrentProduct = (
    field: "pieces" | "packages",
    newValue: string | ((prev: string) => string)
  ) => {
    setProducts((prevProducts) =>
      prevProducts.map((product, index) =>
        index === currentProductIndex
          ? {
              ...product,
              [field === "pieces" ? "amountPieces" : "amountPackages"]:
                typeof newValue === "function"
                  ? newValue(
                      String(
                        product[
                          field === "pieces" ? "amountPieces" : "amountPackages"
                        ]
                      )
                    )
                  : newValue,
            }
          : product
      )
    );
  };

  const goToNextFieldOrProduct = () => {
    if (keypadTarget === "pieces") {
      setKeypadTarget("packages");
    } else {
      setKeypadTarget("pieces");
      setCurrentProductIndex((prevIndex) =>
        prevIndex + 1 >= products.length ? 0 : prevIndex + 1
      );
    }
  };

  if (isLoading) {
    return <div>Loading products...</div>;
  }

  if (error) {
    return <div>Error: {String(error)}</div>;
  }

  const currentProduct = products[currentProductIndex];

  if (!currentProduct) {
    return <div>No products available.</div>;
  }
 

  return (
    <div className="container mx-auto p-5">
      <Toaster />
      <div className="flex flex-col items-center">
      <form onSubmit={handleSubmit} className="w-fit mx-auto mb-20">
          <h3 className="text-2xl font-bold mb-4">{currentProduct.productName}</h3>
          <div className="flex gap-5 mb-5">
            <Input
              value={currentProduct.amountPieces}
              onFocus={() => setKeypadTarget("pieces")}
              readOnly
            />
            <Input
              value={currentProduct.amountPackages}
              onFocus={() => setKeypadTarget("packages")}
              readOnly
            />
          </div>

          <Keypad onKeyPressed={handleKeypadPress} />

          <Button onClick={goToNextFieldOrProduct} className="mt-4">
            Nästa
          </Button>
          
        
            <Button
              type="submit"
              className="w-full mt-10"
              onClick={() => {
                toast({
                  title: "Lyckat!",
                  description: "Inventering skickades iväg",
                });
              }}
            >
              Skicka in inventering
            </Button>
          </form>
        
      </div>
    </div>
  );
};

export default App2;