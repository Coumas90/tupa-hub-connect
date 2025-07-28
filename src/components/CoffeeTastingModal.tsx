import React from 'react';
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Download, Coffee, MapPin, Star } from "lucide-react";

interface CoffeeOrigin {
  name: string;
  profile: string;
  altitude: string;
  character: string;
  region?: string;
  variety?: string;
  process?: string;
  notes?: string;
  origin?: string;
  tastingNotes?: {
    fragrance: number;
    flavor: number;
    aftertaste: number;
    acidity: number;
    body: number;
    balance: number;
    overall: number;
  };
  description?: string;
}

interface CoffeeTastingModalProps {
  isOpen: boolean;
  onClose: () => void;
  coffee: CoffeeOrigin | null;
}

export default function CoffeeTastingModal({ isOpen, onClose, coffee }: CoffeeTastingModalProps) {
  if (!coffee) return null;

  const handleDownloadTechnicalSheet = () => {
    // TODO: Implement PDF download from Resources table
    console.log(`Downloading technical sheet for ${coffee.name}`);
  };

  const handleExploreMore = () => {
    onClose();
  };

  // Get detailed coffee data based on name (this would normally come from database)
  const getDetailedCoffeeData = (coffeeName: string) => {
    const coffeeData: Record<string, any> = {
      "Colombia Huila": {
        region: "Huila",
        variety: "Caturra, Castillo",
        process: "Lavado",
        origin: "COLOMBIA",
        description: "El café de Huila se caracteriza por su perfil limpio y dulce, con notas de chocolate con leche y frutas. Su acidez equilibrada y cuerpo agradable hacen que sea una excelente opción para los amantes del café excepcional.",
        tastingNotes: {
          fragrance: 7.75,
          flavor: 8,
          aftertaste: 7.75,
          acidity: 8,
          body: 7.75,
          balance: 8,
          overall: 8
        },
        notes: "Notas vibrantes de cacao, caramelo y cereza, complementadas con un toque cítrico de naranja, que juntas evocan la frescura de los campos de Huila."
      },
      "Guatemala Antigua": {
        region: "Huehuetenango",
        variety: "Caturra, Bourbon, Catuai, Pace, Pacamara",
        process: "Lavado",
        origin: "GUATEMALA",
        description: "El café de Huehuetenango La Ceiba es un testimonio de la diversidad y riqueza de sabores que ofrece Guatemala. Este café se caracteriza por su acidez brillante y su cuerpo rico, con notas dulces y frutales que lo hacen ideal para diferentes métodos de preparación.",
        tastingNotes: {
          fragrance: 8,
          flavor: 8.25,
          aftertaste: 7.75,
          acidity: 8.0,
          body: 8.0,
          balance: 8,
          overall: 8
        },
        notes: "Aromas vibrantes de cacao, frutas tropicales y notas florales, complementados con un toque de miel y especias que evocan la riqueza de Huehuetenango."
      },
      "Brasil Cerrado": {
        region: "Cerrado, Minas Gerais",
        variety: "Catuai 44 - 20/15, Catuai 785/15, Caturra, Castillo",
        process: "Natural",
        origin: "BRASIL",
        description: "Una fusión aromática donde predominan los tonos achocolatados del Brasil. Los destellos de cereza y naranja aportados por el café colombiano resultan en un sabor complejo que satisface con su riqueza y su equilibrado retrogusto.",
        tastingNotes: {
          fragrance: 7.75,
          flavor: 7.75,
          aftertaste: 7.75,
          acidity: 7.75,
          body: 7.75,
          balance: 7.75,
          overall: 7.75
        },
        notes: "Una fusión aromática donde predominan los tonos achocolatados del Brasil. Los destellos de cereza y naranja aportan complejidad y equilibrio."
      }
    };

    return coffeeData[coffeeName] || {};
  };

  const detailedData = getDetailedCoffeeData(coffee.name);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto p-0 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 border-none shadow-2xl animate-in zoom-in-95 duration-500 data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95">
        <div className="relative">
          {/* Close button */}
          <DialogClose className="absolute right-4 top-4 z-10 rounded-full bg-white/80 p-2 hover:bg-white transition-colors">
            <X className="h-4 w-4" />
          </DialogClose>

          {/* Book-style content */}
          <div className="grid md:grid-cols-2 min-h-[600px]">
            {/* Left page - Character and basic info */}
            <div className="relative p-8 bg-gradient-to-br from-amber-50 to-orange-100 border-r border-orange-200">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 to-orange-100/50 opacity-30" />
              
              <div className="relative z-10 text-center space-y-6">
                <Badge className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-4 py-2 text-lg font-bold">
                  {detailedData.origin || coffee.name.split(' ')[0]}
                </Badge>
                
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold text-orange-800">
                    {coffee.name}
                  </h2>
                  <p className="text-orange-600 font-medium">
                    {detailedData.region || coffee.name.split(' ')[1]}
                  </p>
                </div>

                <div className="relative">
                  <img 
                    src={coffee.character} 
                    alt={`Maestro de ${coffee.name}`}
                    className="w-48 h-48 mx-auto object-contain drop-shadow-2xl"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-white/60 rounded-lg p-3 backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="h-4 w-4 text-orange-600" />
                      <span className="font-semibold text-orange-800">Región</span>
                    </div>
                    <p className="text-orange-700">{detailedData.region || "Región especial"}</p>
                  </div>
                  
                  <div className="bg-white/60 rounded-lg p-3 backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <Coffee className="h-4 w-4 text-orange-600" />
                      <span className="font-semibold text-orange-800">Varietal</span>
                    </div>
                    <p className="text-orange-700 text-xs">{detailedData.variety || "Variedad especial"}</p>
                  </div>
                  
                  <div className="bg-white/60 rounded-lg p-3 backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <Star className="h-4 w-4 text-orange-600" />
                      <span className="font-semibold text-orange-800">Altitud</span>
                    </div>
                    <p className="text-orange-700">{coffee.altitude}</p>
                  </div>
                  
                  <div className="bg-white/60 rounded-lg p-3 backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <Coffee className="h-4 w-4 text-orange-600" />
                      <span className="font-semibold text-orange-800">Proceso</span>
                    </div>
                    <p className="text-orange-700">{detailedData.process || "Proceso especial"}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right page - Detailed tasting information */}
            <div className="relative p-8 bg-gradient-to-br from-orange-50 to-amber-100">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 to-amber-100/50 opacity-30" />
              
              <div className="relative z-10 space-y-6">
                <div>
                  <h3 className="text-2xl font-bold text-orange-800 mb-3">Perfil de Cata</h3>
                  <div className="bg-white/70 rounded-lg p-4 backdrop-blur-sm">
                    <p className="text-orange-700 font-medium text-lg">{coffee.profile}</p>
                  </div>
                </div>

                {detailedData.tastingNotes && (
                  <div>
                    <h4 className="text-lg font-bold text-orange-800 mb-3">Puntuación SCA</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-white/60 rounded-lg p-2">
                        <span className="font-semibold text-orange-800">Fragancia:</span>
                        <span className="float-right text-orange-700">{detailedData.tastingNotes.fragrance}</span>
                      </div>
                      <div className="bg-white/60 rounded-lg p-2">
                        <span className="font-semibold text-orange-800">Sabor:</span>
                        <span className="float-right text-orange-700">{detailedData.tastingNotes.flavor}</span>
                      </div>
                      <div className="bg-white/60 rounded-lg p-2">
                        <span className="font-semibold text-orange-800">Retrogusto:</span>
                        <span className="float-right text-orange-700">{detailedData.tastingNotes.aftertaste}</span>
                      </div>
                      <div className="bg-white/60 rounded-lg p-2">
                        <span className="font-semibold text-orange-800">Acidez:</span>
                        <span className="float-right text-orange-700">{detailedData.tastingNotes.acidity}</span>
                      </div>
                      <div className="bg-white/60 rounded-lg p-2">
                        <span className="font-semibold text-orange-800">Cuerpo:</span>
                        <span className="float-right text-orange-700">{detailedData.tastingNotes.body}</span>
                      </div>
                      <div className="bg-white/60 rounded-lg p-2">
                        <span className="font-semibold text-orange-800">Balance:</span>
                        <span className="float-right text-orange-700">{detailedData.tastingNotes.balance}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="text-lg font-bold text-orange-800 mb-3">Notas de Cata</h4>
                  <div className="bg-white/70 rounded-lg p-4 backdrop-blur-sm">
                    <p className="text-orange-700 leading-relaxed">
                      {detailedData.notes || "Notas de cata detalladas del café, describiendo sus características únicas de sabor y aroma."}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-bold text-orange-800 mb-3">Historia del Origen</h4>
                  <div className="bg-white/70 rounded-lg p-4 backdrop-blur-sm">
                    <p className="text-orange-700 leading-relaxed text-sm">
                      {detailedData.description || "Historia y tradición del café de esta región, contando sobre los productores y el proceso único que hace especial a este café."}
                    </p>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button 
                    onClick={handleDownloadTechnicalSheet}
                    className="flex-1 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Ver ficha técnica
                  </Button>
                  <Button 
                    onClick={handleExploreMore}
                    variant="outline" 
                    className="flex-1 border-orange-300 text-orange-700 hover:bg-orange-50 rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
                  >
                    <Coffee className="h-4 w-4 mr-2" />
                    Explorar más variedades
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}