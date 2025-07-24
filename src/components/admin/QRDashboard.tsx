import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Download, QrCode, Palette, Image, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Cafe {
  id: string;
  name: string;
  description?: string;
  brand_color: string;
  logo_url?: string;
  qr_generated_at?: string;
  owner_id: string;
}

interface QRDashboardProps {
  cafeId?: string;
}

export function QRDashboard({ cafeId }: QRDashboardProps) {
  const [cafe, setCafe] = useState<Cafe | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [brandColor, setBrandColor] = useState("#8B5CF6");
  const [logoUrl, setLogoUrl] = useState("");

  useEffect(() => {
    loadCafe();
  }, [cafeId]);

  const loadCafe = async () => {
    try {
      setLoading(true);
      
      let query = supabase.from('cafes').select('*');
      
      if (cafeId) {
        query = query.eq('id', cafeId);
      } else {
        // Get current user's cafe
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast.error("Debes estar autenticado");
          return;
        }
        query = query.eq('owner_id', user.id);
      }
      
      const { data, error } = await query.single();

      if (error) {
        console.error('Error loading cafe:', error);
        toast.error("Error al cargar la información del café");
        return;
      }

      setCafe(data);
      setBrandColor(data.brand_color || "#8B5CF6");
      setLogoUrl(data.logo_url || "");
    } catch (error) {
      console.error('Error:', error);
      toast.error("Error al cargar los datos");
    } finally {
      setLoading(false);
    }
  };

  const updateCafeBranding = async () => {
    if (!cafe) return;

    try {
      const { error } = await supabase
        .from('cafes')
        .update({
          brand_color: brandColor,
          logo_url: logoUrl || null
        })
        .eq('id', cafe.id);

      if (error) throw error;

      setCafe({ ...cafe, brand_color: brandColor, logo_url: logoUrl });
      toast.success("Branding actualizado correctamente");
    } catch (error) {
      console.error('Error updating branding:', error);
      toast.error("Error al actualizar el branding");
    }
  };

  const generateQR = async (format: 'svg' | 'png') => {
    if (!cafe) return;

    try {
      setGenerating(true);

      const { data, error } = await supabase.functions.invoke('qr-generate', {
        body: {
          cafe_id: cafe.id,
          format
        }
      });

      if (error) throw error;

      // The function returns the file directly, so we need to handle it as a blob
      const response = await supabase.functions.invoke('qr-generate', {
        body: {
          cafe_id: cafe.id,
          format
        }
      });

      if (response.error) throw response.error;

      // Create download link
      const contentType = format === 'png' ? 'image/png' : 'image/svg+xml';
      const blob = new Blob([response.data], { type: contentType });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `qr-${cafe.name.replace(/\s+/g, '-').toLowerCase()}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`QR ${format.toUpperCase()} generado y descargado`);
      
      // Reload cafe to update generation timestamp
      loadCafe();
    } catch (error) {
      console.error('Error generating QR:', error);
      toast.error("Error al generar el código QR");
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted animate-pulse rounded"></div>
        <div className="h-32 bg-muted animate-pulse rounded"></div>
      </div>
    );
  }

  if (!cafe) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <QrCode className="mx-auto h-12 w-12 mb-4" />
            <p>No se encontró información del café</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <QrCode className="h-6 w-6" />
        <h2 className="text-2xl font-bold">Generador de QR</h2>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Cafe Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="h-5 w-5" />
              Información del Café
            </CardTitle>
            <CardDescription>
              Personaliza el branding de tu código QR
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="cafe-name">Nombre del Café</Label>
              <Input
                id="cafe-name"
                value={cafe.name}
                disabled
                className="bg-muted"
              />
            </div>

            <div>
              <Label htmlFor="brand-color">Color de Marca</Label>
              <div className="flex gap-2">
                <Input
                  id="brand-color"
                  type="color"
                  value={brandColor}
                  onChange={(e) => setBrandColor(e.target.value)}
                  className="w-16 h-10 p-1"
                />
                <Input
                  value={brandColor}
                  onChange={(e) => setBrandColor(e.target.value)}
                  placeholder="#8B5CF6"
                  className="flex-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="logo-url">URL del Logo (opcional)</Label>
              <Input
                id="logo-url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://ejemplo.com/logo.png"
              />
            </div>

            <Button onClick={updateCafeBranding} className="w-full">
              <Palette className="h-4 w-4 mr-2" />
              Actualizar Branding
            </Button>
          </CardContent>
        </Card>

        {/* QR Generation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Generar Código QR
            </CardTitle>
            <CardDescription>
              Descarga tu código QR personalizado con branding TUPÁ
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {cafe.qr_generated_at && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Último QR generado: {new Date(cafe.qr_generated_at).toLocaleDateString()}
              </div>
            )}

            <div className="space-y-2">
              <Button
                onClick={() => generateQR('svg')}
                disabled={generating}
                className="w-full"
                variant="outline"
              >
                <Download className="h-4 w-4 mr-2" />
                {generating ? "Generando..." : "Descargar SVG"}
              </Button>

              <Button
                onClick={() => generateQR('png')}
                disabled={generating}
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                {generating ? "Generando..." : "Descargar PNG"}
              </Button>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Características del QR:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Logo TUPÁ Hub incluido</li>
                <li>• Nombre de tu café personalizado</li>
                <li>• Color de marca aplicado</li>
                <li>• Instrucciones para clientes</li>
                <li>• Enlace directo a formulario de feedback</li>
              </ul>
            </div>

            <Badge variant="secondary" className="w-full justify-center">
              URL del QR: /feedback/{cafe.id}
            </Badge>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}