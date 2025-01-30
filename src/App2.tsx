import { useEffect, useState } from "react";
import Keypad, { KeypadKeys } from "./components/Keypad";
import { Input } from "./components/ui/input";
import { Button } from "./components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { toast } from "./hooks/use-toast";
import { Toaster } from "./components/ui/toaster";
import {
  ArrowBigLeft,
  ArrowBigLeftDash,
  ArrowBigRight,
  LayoutList,
} from "lucide-react";
import { InventoryDialog } from "./components/InventoryDialog";
import { handleVibrate } from "./components/HandleVibrateFunction";

type KioskInventory = {
  id: string;
  kioskName: string;
  facilityName: string;
  inventoryDate: string;
  products: Product[];
  firstInventoryMade: boolean;
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
  const [inventoryDate, setInventoryDate] = useState("");

  const { data, isLoading, error } = useQuery<KioskInventory>({
    queryKey: ["inventoryList"],
    queryFn: async () => {
      const response = await fetch(
        `https://zxilxqtzdb.execute-api.eu-north-1.amazonaws.com/prod/facilities/0243e69a-88af-47af-b6ab-cc9300b9e680/06412156-c36f-4cc0-b792-87f5510c8bd4/kiosks/eca1493f-45d3-4c88-8c8c-d6433bba8657/inventories`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (!response) {
        throw new Error("Failed to fetch products");
      }
      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }
      const dataResponse: KioskInventory = await response.json();
      return dataResponse;
    },
  });

  useEffect(() => {
    if (data) {
      const updatedProducts = data.products.map((product) => ({
        ...product,
        amountPieces: "",
        amountPackages: "",
      }));
      setEditedProducts(updatedProducts);
      console.log("Updated editedProducts:", updatedProducts);
      const lastInventoryDate = data.inventoryDate;
      setInventoryDate(lastInventoryDate);
    }
  }, [data]);

  const calculateTimeSinceLastInventory = (inventoryDate: string) => {
    const currentTimeStamp = new Date();
    const lastInventoryDate = new Date(inventoryDate);

    // Beräkna skillnaden i millisekunder
    const timeDifference =
      currentTimeStamp.getTime() - lastInventoryDate.getTime();

    // Hantera framtida datum
    if (timeDifference < 0) {
      return { updatedInventoryDate: "Inventeringen ligger i framtiden!" };
    }

    // Konvertera millisekunder till dagar, timmar och minuter
    const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    const minutes = Math.floor(
      (timeDifference % (1000 * 60 * 60)) / (1000 * 60)
    );

    // Skapa en mänskligt läsbar sträng baserat på tiden
    const updatedInventoryDate =
      days > 0
        ? `${days} dagar, ${hours} timmar och ${minutes} minuter sen`
        : hours > 0
        ? `${hours} timmar och ${minutes} minuter sen`
        : `${minutes} minuter sen`;

    return { updatedInventoryDate };
  };

  //valideringsflagga
  const isValid = editedProducts?.every(
    (item) => item.amountPieces != "" && item.amountPackages != ""
  );
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    editedProducts.forEach((product) => {
      product.amountPieces = Number(product.amountPieces);
      product.amountPackages = Number(product.amountPackages);
    });

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
        `https://zxilxqtzdb.execute-api.eu-north-1.amazonaws.com/prod/facilities/0243e69a-88af-47af-b6ab-cc9300b9e680/06412156-c36f-4cc0-b792-87f5510c8bd4/kiosks/eca1493f-45d3-4c88-8c8c-d6433bba8657/inventories`,
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
        description: "Inventeringen skickades iväg! Du kan nu stänga fönstret.",
        className: "bg-green-200",
      });

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
    setEditedProducts((prevProducts) =>
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
                      ) || ""
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

  const currentProduct = editedProducts[currentProductIndex];

  console.log(editedProducts);

  if (!currentProduct) {
    return <div>No products available.</div>;
  }

  const handleFocus = (field: "pieces" | "packages") => {
    setActiveInput(field);
  };

  const { updatedInventoryDate } =
    calculateTimeSinceLastInventory(inventoryDate);

  return (
    <>
      <InventoryDialog
        facility={data!.facilityName}
        kiosk={data!.kioskName}
        inventoryDate={updatedInventoryDate}
        firstInventoryMade={data!.firstInventoryMade}
      />

      <Toaster />
      <div className="relative h-full">
        <div
          className={`${
            isListView ? "opacity-0 pointer-events-none" : "opacity-100"
          } transition-opacity duration-100 absolute inset-0 ${
            isTransitioning ? "z-10" : ""
          }`}
        >
          {!isListView && (
            <div className="grid grid-rows-[auto_auto_2fr] h-[80vh] container mx-auto p-4 gap-3">
              <div className="flex flex-col items-center justify-center relative">
                <form onSubmit={handleSubmit} className="w-fit mx-auto ">
                  {/* Progress display */}
                  <div className="">
                    <h3 className="min-[376px]:text-2xl text-xl font-bold text-center p-2 mb-3">
                      {currentProduct.productName}
                    </h3>
                    <span
                      className={`text-right text-xs absolute top-12 right-0 ${
                        isValid ? "bg-green-200" : "bg-neutral-200"
                      } rounded-full p-2`}
                    >
                      {currentProductIndex + 1}/{data?.products.length}
                    </span>
                  </div>

                  <div className="flex flex-col gap-6">
                    <div className="flex flex-col mx-auto">
                      <p className="text-xs font-semibold">Antal i styck</p>

                      <Input
                        value={currentProduct.amountPieces}
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
                    </div>
                    <div className="flex flex-col mx-auto">
                      <p className="text-xs font-semibold">
                        Antal i obrutna förpackningar
                      </p>

                      <Input
                        value={currentProduct.amountPackages}
                        onFocus={() => {
                          handleFocus("packages");
                          setKeypadTarget("packages");
                        }}
                        onClick={() => {
                          handleFocus("packages");
                          setKeypadTarget("packages");
                        }}
                        onChange={(e) =>
                          updateCurrentProduct("packages", () => e.target.value)
                        }
                        readOnly
                        className={`border-b-2 border-black border-x-0 border-t-0 shadow-none rounded-none focus:outline-none focus-visible:ring-0 focus:border-orange-200 active:border-orange-200 w-[200px] p-2   ${
                          activeInput === "packages"
                            ? "border-orange-400 "
                            : "border-gray-300"
                        }`}
                      />
                    </div>
                  </div>

                  <div className="w-full flex">
                    <Button
                      type="submit"
                      variant={"secondary"}
                      className={`mt-5 mx-auto ${
                        !isValid ? "bg-gray-500" : "bg-orange-400"
                      }`}
                      disabled={!isValid}
                      onClick={() => {
                        handleVibrate();
                      }}
                    >
                      Skicka in inventering
                    </Button>
                  </div>
                </form>
              </div>
              <div className="flex justify-between mx-5">
                <Button
                  type="button"
                  onClick={() => {
                    goToPreviousFieldOrProduct();
                    handleVibrate();
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
                    handleVibrate();
                  }}
                >
                  Byt till listvy
                  <LayoutList className="w-20 h-20" />
                </Button>

                <Button
                  type="button"
                  onClick={() => {
                    goToNextFieldOrProduct();
                    handleVibrate();
                  }}
                  className={`place-self-center rounded-xl h-12`}
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
            <div className="container mx-auto p-3 h-[100vh] lg: w-full">
              <div className="rounded-xl border border-black border-solid h-full text-black">
                <h2 className="text-lg lg:text-3xl text-center w-full mt-10 font-bold">
                  Inventera {data!.facilityName} {data!.kioskName}
                </h2>
                <div className="w-full place-items-center mt-5 gap-3 mb-16">
                  <p className="text-sm lg:text-lg">
                    Senast inventering gjord:
                  </p>
                  <h3 className="lg:text-lg text-xs font-semibold">
                    {updatedInventoryDate}
                  </h3>
                </div>

                <form onSubmit={handleSubmit} className="">
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
                            name="amountPieces"
                            value={product.amountPieces}
                            onChange={(e) =>
                              setEditedProducts((prev) =>
                                prev.map((p, i) =>
                                  i === index
                                    ? { ...p, amountPieces: e.target.value }
                                    : p
                                )
                              )
                            }
                          />
                        </div>
                        <div className="flex flex-col">
                          <label className="text-sm font-semibold">
                            Antal i förpackning
                          </label>
                          <Input
                            type="number"
                            name="amountPackages"
                            value={product.amountPackages}
                            onChange={(e) =>
                              setEditedProducts((prev) =>
                                prev.map((p, i) =>
                                  i === index
                                    ? { ...p, amountPackages: e.target.value }
                                    : p
                                )
                              )
                            }
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="mx-auto w-fit">
                    <Button
                      type="submit"
                      variant={"secondary"}
                      className={`mt-5 mx-auto ${
                        !isValid ? "bg-gray-500" : "bg-orange-400"
                      }`}
                      disabled={!isValid}
                      onClick={() => {
                        handleVibrate();
                      }}
                    >
                      Skicka in inventering
                    </Button>
                  </div>
                </form>

                <Button
                  type="button"
                  className={`w-16 h-16 shadow border m-1 p-1 rounded-xl fixed right-3 bottom-3 lg:right-10 xl:right-36 `}
                  variant={"outline"}
                  onClick={() => {
                    toggleListView();
                    handleVibrate();
                  }}
                >
                  <ArrowBigLeftDash className="w-20 h-20" />
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
