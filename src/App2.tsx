import { useEffect, useState } from "react";
import Keypad, { KeypadKeys } from "./components/Keypad";
import { Input } from "./components/ui/input";
import { Button } from "./components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { toast } from "./hooks/use-toast";
import { Toaster } from "./components/ui/toaster";
import { ArrowBigLeft, ArrowBigRight, LayoutList } from "lucide-react";
import { InventoryDialog } from "./components/InventoryDialog";

type KioskInventory = {
  id: string;
  kioskName: string;
  inventoryDate: string;
  products: Product[];
};

interface Product {
  id: string;
  productName: string;
  amountPieces: number | string;
  amountPackages: number | string;
}

const App2 = () => {
  const [currentProductIndex, setCurrentProductIndex] = useState(0);
  const [keypadTarget, setKeypadTarget] = useState<"pieces" | "packages">(
    "pieces"
  );
  const [editedProducts, setEditedProducts] = useState<Product[]>([]);
  const [activeInput, setActiveInput] = useState<"pieces" | "packages" | null>(
    "pieces"
  );
  const [isListView, setIsListView] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const facility = "Rosta Gärde";
  const kiosk = "Kiosk 1";
  const inventoryDate = "2025-06-13 14:25";

  const { data, isLoading, error } = useQuery<Product[]>({
    queryKey: ["inventoryList"],
    queryFn: async () => {
      const response = await fetch(`https://zxilxqtzdb.execute-api.eu-north-1.amazonaws.com/prod/facilities/0243e69a-88af-47af-b6ab-cc9300b9e680/6a81c35e-ff89-4520-9bb8-b743352fb8d3/kiosks/39c135a2-cdce-47b7-856e-3e5772568712/inventories`, { 
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response) {
        throw new Error("Failed to fetch products");
      }
      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }
      const dataResponse: KioskInventory = await response.json();
      return dataResponse.products;
    },
  });

  // useEffect(() => {
  //   if (data) {
  //     const initialProducts = data.map((item) => item.products);
  //     setEditedProducts(initialProducts);
  //   }
  // }, [data]);

  useEffect(() => {
    if (data) {
      const updatedProducts = data.map((product) => ({
        ...product,
        amountPieces: "",
        amountPackages: "",
      }));
      setEditedProducts(updatedProducts);
      console.log("Updated editedProducts:", updatedProducts);
    }
  }, [data]);

  //valideringsflagga
  const isValid = editedProducts?.every(item =>
    item.amountPieces != "" && item.amountPackages != ""
    )


  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault(); // Förhindra formulärets standardomladdning

    if (!isValid) {
      toast({
        title: "Misslyckades",
        description: "Alla fält måste fyllas i.",
        className: "bg-red-200",
      });
      return;
    }

    try {
      const response = await fetch(
        `https://zxilxqtzdb.execute-api.eu-north-1.amazonaws.com/prod/facilities/0243e69a-88af-47af-b6ab-cc9300b9e680/60e5a8a8-745e-4109-b034-1453a586f7c1/kiosks/bae9fd68-90d4-4a5a-b1af-b3124b49b31d/inventories`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ products: editedProducts }),
        }
      );

      if (!response) {
        toast({
          title: "Misslyckat!",
          description: "Inventeringen kunde inte skickas iväg",
          className: "bg-red-200",
        });
        throw new Error("Failed to send inventory");
      }
      if (!response.ok) {
        toast({
          title: "Misslyckat!",
          description: "Inventeringen kunde inte skickas iväg",
          className: "bg-red-200",
        });
        throw new Error("Failed to send inventory");
      }
      toast({
        title: "Lyckat!",
        description: "Inventeringen skickades iväg",
        className: "bg-green-200",
      });

      // återställer alla fält
      setEditedProducts((prevProducts) =>
        prevProducts.map((product) => ({
          ...product,
          amountPieces: "",
          amountPackages: "",
        }))
      );
    } catch (error) {
      console.error("Update failed:", error);
      toast({
        title: "Error",
        description: "Misslyckades med att spara ändringar.",
        className: "bg-red-200",
      });
    }
  };

  const handleKeypadPress = (keyPadKey: KeypadKeys) => {
    if (!editedProducts.length) return;

    const currentProduct = editedProducts[currentProductIndex];

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
    setEditedProducts(prevProducts =>
      prevProducts.map((product, index) =>
        index === currentProductIndex
          ? {
              ...product,
              [field === "pieces" ? "amountPieces" : "amountPackages"]:
                typeof newValue === "function"
                  ? newValue(String(product[field === "pieces" ? "amountPieces" : "amountPackages"]) || "")
                  : newValue,
            }
          : product
      )
    );
  };
  
  

  const goToNextFieldOrProduct = () => {
    if (keypadTarget === "pieces") {
      setKeypadTarget("packages");
      handleFocus("packages");
    } else {
      setKeypadTarget("pieces");
      handleFocus("pieces");
      setCurrentProductIndex((prevIndex) =>
        prevIndex + 1 >= editedProducts.length ? 0 : prevIndex + 1
      );
    }
  };

  const goToPreviousFieldOrProduct = () => {
    if (keypadTarget === "packages") {
      setKeypadTarget("pieces");
      handleFocus("pieces");
    } else if (isValid) {
      setCurrentProductIndex((prevIndex) =>
        prevIndex === 0 ? editedProducts.length - 1 : prevIndex - 1
      );
      setKeypadTarget("packages");
      handleFocus("packages");
    } else {
      setKeypadTarget("packages");
      handleFocus("packages");
      setCurrentProductIndex((prevIndex) =>
        prevIndex - 1 >= editedProducts.length ? 0 : prevIndex - 1
      );
    }
  };

  const toggleListView = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setIsListView((prev) => !prev);
      setIsTransitioning(false);
    }, 300);
  };

  if (isLoading || !editedProducts.length) {
    return <div>Loading products...</div>;
  }

  if (error) {
    return <div>Error: {String(error)}</div>;
  }

  // const currentProduct = data?.map(
  //   (item) => item.products[currentProductIndex]
  // );

  const currentProduct = editedProducts[currentProductIndex];
const currentAmountPieces = currentProduct?.amountPieces;
const currentAmountPackages = currentProduct?.amountPackages;
  
  console.log(editedProducts);
  
  if (!currentProduct) {
    return <div>No products available.</div>;
  }

  const handleFocus = (field: "pieces" | "packages") => {
    setActiveInput(field);
  };

  return (
    <>
      <InventoryDialog
        facility={facility}
        kiosk={kiosk}
        inventoryDate={inventoryDate}
      />
      <Toaster />
      <div className="relative h-[90vh]">
        <div
          className={`${
            isListView ? "opacity-0 pointer-events-none" : "opacity-100"
          } transition-opacity duration-100 absolute inset-0 ${
            isTransitioning ? "z-10" : ""
          }`}
        >
          {!isListView && (
            <div className="grid grid-rows-[auto_auto_2fr]  h-[90vh] container mx-auto p-4">
              {/* <div>
                <h2 className="text-center w-full mb-1 h-fit">
                  {facility} {kiosk}
                </h2>
                <p className="text-center text-xs">
                  Senast inventering: {inventoryDate}
                </p>
              </div> */}

              <div className="flex flex-col items-center justify-center relative mb-5">
                <form onSubmit={handleSubmit} className="w-fit mx-auto mb-5">
                  {/* Progress display */}
                  <div className="mt-auto">
                    <h3 className="text-2xl font-bold text-center p-2 mb-6">
                      {currentProduct.productName}
                    </h3>
                    <span
                      className={`text-right text-xs absolute top-7 right-0 ${
                        isValid ? "bg-green-200" : "bg-neutral-200"
                      } rounded-full p-2`}
                    >
                      {currentProductIndex + 1}/{data?.length}
                    </span>
                  </div>

                  <div className="flex flex-col gap-6">
                    <div className="flex flex-col mx-auto">
                      {/* {activeInput === "pieces" && ( */}
                      <>
                        <p className="text-xs font-semibold">Antal i styck</p>

                        <Input
                          value={currentAmountPieces}
                          onFocus={() => {
                            handleFocus("pieces");
                            setKeypadTarget("pieces");
                          }}
                          onClick={() => {
                            handleFocus("pieces");
                            setKeypadTarget("pieces");
                          }}
                          onChange={(e) =>
                            updateCurrentProduct("pieces", () => e.target.value)
                          }
                          readOnly
                          autoFocus
                          className={`border-b-2 border-black border-x-0 border-t-0 shadow-none rounded-none focus:outline-none focus-visible:ring-0 focus:border-orange-200 active:border-orange-200 w-[200px] p-2  ${
                            activeInput === "pieces"
                              ? "border-orange-400 "
                              : "border-gray-300"
                          }`}
                        />
                      </>
                    </div>
                    <div className="flex flex-col mx-auto">
                      {/* {activeInput === "packages" && ( */}
                      <>
                        <p className="text-xs font-semibold">
                          Antal i obrutna förpackningar
                        </p>

                        <Input
                          value={currentAmountPackages}
                          onFocus={() => {
                            handleFocus("packages");
                            setKeypadTarget("packages");
                          }}
                          onClick={() => {
                            handleFocus("packages");
                            setKeypadTarget("packages");
                          }}
                          onChange={(e) =>
                            updateCurrentProduct(
                              "packages",
                              () => e.target.value
                            )
                          }
                          readOnly
                          className={`border-b-2 border-black border-x-0 border-t-0 shadow-none rounded-none focus:outline-none focus-visible:ring-0 focus:border-orange-200 active:border-orange-200 w-[200px] p-2   ${
                            activeInput === "packages"
                              ? "border-orange-400 "
                              : "border-gray-300"
                          }`}
                        />
                      </>
                    </div>
                  </div>
                  {isValid && (
                    <div className="w-full flex">
                      <Button type="submit" className="mt-10 mx-auto">
                        Skicka in inventering
                      </Button>
                    </div>
                  )}
                </form>
              </div>
              <div className="flex justify-between mx-5">
                <Button
                  type="button"
                  onClick={() => {
                    goToPreviousFieldOrProduct();
                  }}
                  className={`place-self-center rounded-xl h-12 ${
                    currentProductIndex === 0 &&
                    activeInput === "pieces" &&
                    !isValid
                      ? "invisible"
                      : ""
                  }`}
                  variant={"outline"}
                >
                  <ArrowBigLeft />
                </Button>
                <Button
                  type="button"
                  className="w-36 h-12 shadow border m-1 p-1 rounded-xl font-light"
                  variant={"default"}
                  onClick={() => {
                    toggleListView();
                  }}
                >
                  Byt till listvy
                  <LayoutList className="w-20 h-20" />
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    goToNextFieldOrProduct();
                  }}
                  className="place-self-center rounded-xl h-12"
                  variant={"outline"}
                >
                  <ArrowBigRight className="" />
                </Button>
              </div>
              <div className="flex relative">
                <Keypad onKeyPressed={handleKeypadPress} />
              </div>
            </div>
          )}
        </div>
        <div
          className={`${
            isListView ? "opacity-100" : "opacity-0 pointer-events-none"
          } transition-opacity duration-100 absolute inset-0 ${
            isTransitioning ? "z-10" : ""
          }`}
        >
          {isListView && (
            <div className="container mx-auto p-3 ">
              <div className="rounded-xl border border-black border-solid text-black aspect-video relative">
                <h2 className="text-lg lg:text-3xl text-center w-full mt-10 font-bold">
                  Inventera {facility} {kiosk}
                </h2>
                <div className="w-full place-items-center mt-5 gap-3 mb-16">
                  <p className="text-sm lg:text-lg">
                    Senast inventering gjord:
                  </p>
                  <h3 className="lg:text-lg font-semibold">{inventoryDate}</h3>
                </div>

                <form onSubmit={handleSubmit}>
                  {editedProducts?.map((product, index) => (
                    <div
                      key={product.id}
                      className={`space-y-4 lg:flex ${
                        index % 2 === 0
                          ? "bg-gray-100 rounded-lg p-5"
                          : "bg-white rounded-lg p-5"
                      }`}
                    >
                      <div className="flex flex-col lg:flex-row lg:gap-4">
                        <h3 className="text-lg font-bold">
                          {product.productName}
                        </h3>
                        <div className="flex flex-col">
                          <label className="text-sm font-semibold">
                            Antal i styck
                          </label>
                          <Input
                            type="number"
                            value={product.amountPieces}
                            // onChange={(e) =>
                            //   setEditedProducts((prev) =>
                            //     prev.map((p, i) =>
                            //       i === index
                            //         ? { ...p, amountPieces: e.target.value }
                            //         : p
                            //     )
                            //   )
                            // }
                          />
                        </div>
                        <div className="flex flex-col">
                          <label className="text-sm font-semibold">
                            Antal i förpackning
                          </label>
                          <Input
                            type="number"
                            value={product.amountPackages}
                            // onChange={(e) =>
                            //   setEditedProducts((prev) =>
                            //     prev.map((p, i) =>
                            //       i === index
                            //         ? { ...p, amountPackages: e.target.value }
                            //         : p
                            //     )
                            //   )
                            // }
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="mx-auto w-fit">
                    <Button
                      type="submit"
                      className={`mt-5 mx-auto ${
                        !isValid ? "bg-gray-500" : ""
                      }`}
                      disabled={!isValid}
                    >
                      Skicka in inventering
                    </Button>
                  </div>
                </form>
                <Button
                  type="button"
                  className={`w-16 h-16 shadow border m-1 p-1 rounded-xl fixed right-3 bottom-3 `}
                  variant={"outline"}
                  onClick={() => {
                    toggleListView();
                  }}
                >
                  <LayoutList className="w-20 h-20" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default App2;
