import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Star, MessageSquare, Gift, Coffee } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Cafe {
  id: string;
  name: string;
  description?: string;
  brand_color: string;
}

export default function FeedbackForm() {
  const { cafeId } = useParams<{ cafeId: string }>();
  const [cafe, setCafe] = useState<Cafe | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  // Form state
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [participateInGiveaway, setParticipateInGiveaway] = useState(false);

  useEffect(() => {
    if (cafeId) {
      loadCafe();
    }
  }, [cafeId]);

  const loadCafe = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('cafes')
        .select('*')
        .eq('id', cafeId)
        .single();

      if (error) {
        console.error('Error loading cafe:', error);
        toast.error("Café no encontrado");
        return;
      }

      setCafe(data);
    } catch (error) {
      console.error('Error:', error);
      toast.error("Error al cargar información del café");
    } finally {
      setLoading(false);
    }
  };

  const handleStarClick = (selectedRating: number) => {
    setRating(selectedRating);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!cafe || !rating || !customerName.trim()) {
      toast.error("Por favor completa todos los campos requeridos");
      return;
    }

    try {
      setSubmitting(true);

      // Submit feedback
      const { error: feedbackError } = await supabase
        .from('feedbacks')
        .insert({
          cafe_id: cafe.id,
          customer_name: customerName.trim(),
          customer_email: customerEmail.trim() || null,
          rating,
          comment: comment.trim() || null
        });

      if (feedbackError) throw feedbackError;

      // If user wants to participate in giveaway and provided contact info
      if (participateInGiveaway && (customerEmail.trim() || phone.trim())) {
        const { error: giveawayError } = await supabase
          .from('giveaway_participants')
          .insert({
            cafe_id: cafe.id,
            customer_name: customerName.trim(),
            customer_email: customerEmail.trim(),
            phone: phone.trim() || null,
            campaign_id: `feedback-${Date.now()}`
          });

        if (giveawayError) {
          console.error('Giveaway participation error:', giveawayError);
          // Don't fail the whole process if giveaway fails
        }
      }

      setSubmitted(true);
      toast.success("¡Gracias por tu feedback!");

    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error("Error al enviar el feedback");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="h-8 bg-muted animate-pulse rounded"></div>
              <div className="h-4 bg-muted animate-pulse rounded"></div>
              <div className="h-32 bg-muted animate-pulse rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!cafe) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <Coffee className="mx-auto h-12 w-12 mb-4" />
              <p>Café no encontrado</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div 
              className="mx-auto w-16 h-16 rounded-full flex items-center justify-center text-white mb-4"
              style={{ backgroundColor: cafe.brand_color }}
            >
              <MessageSquare className="h-8 w-8" />
            </div>
            <CardTitle>¡Gracias por tu feedback!</CardTitle>
            <CardDescription>
              Tu opinión es muy importante para {cafe.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            {participateInGiveaway && (
              <div className="p-4 bg-muted rounded-lg">
                <Gift className="mx-auto h-8 w-8 mb-2 text-primary" />
                <p className="text-sm">
                  ¡También participas en nuestros sorteos! Te contactaremos si resultas ganador.
                </p>
              </div>
            )}
            <Badge variant="secondary" className="w-full justify-center py-2">
              Powered by TUPÁ Hub
            </Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div 
            className="mx-auto w-16 h-16 rounded-full flex items-center justify-center text-white mb-4"
            style={{ backgroundColor: cafe.brand_color }}
          >
            <Coffee className="h-8 w-8" />
          </div>
          <CardTitle>{cafe.name}</CardTitle>
          <CardDescription>
            Comparte tu experiencia con nosotros
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Rating */}
            <div className="text-center">
              <Label className="text-base font-medium">¿Cómo calificarías tu experiencia?</Label>
              <div className="flex justify-center gap-2 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleStarClick(star)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      className={`h-8 w-8 ${
                        star <= rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Customer Info */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Tu nombre"
                  required
                />
              </div>

              <div>
                <Label htmlFor="email">Email (opcional)</Label>
                <Input
                  id="email"
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="tu@email.com"
                />
              </div>
            </div>

            {/* Comment */}
            <div>
              <Label htmlFor="comment">Comentarios (opcional)</Label>
              <Textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Cuéntanos más sobre tu experiencia..."
                className="min-h-[100px]"
              />
            </div>

            {/* Giveaway Participation */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="giveaway"
                  checked={participateInGiveaway}
                  onChange={(e) => setParticipateInGiveaway(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="giveaway" className="text-sm">
                  Quiero participar en sorteos y promociones
                </Label>
              </div>

              {participateInGiveaway && (
                <div>
                  <Label htmlFor="phone">Teléfono (opcional)</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1234567890"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Para contactarte si resultas ganador
                  </p>
                </div>
              )}
            </div>

            <Button
              type="submit"
              disabled={submitting || !rating || !customerName.trim()}
              className="w-full"
              style={{ backgroundColor: cafe.brand_color }}
            >
              {submitting ? "Enviando..." : "Enviar Feedback"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Badge variant="outline" className="text-xs">
              Powered by TUPÁ Hub
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}