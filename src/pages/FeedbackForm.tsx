import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Star, MessageSquare, Gift, Coffee, Users, Home } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Location {
  id: string;
  name: string;
  description?: string;
  brand_color: string;
}

interface FeedbackFormData {
  coffeeRating: number;
  serviceRating: number;
  ambianceComment: string;
  customerName: string;
  customerEmail?: string;
  participateInGiveaway: boolean;
}

export default function FeedbackForm() {
  const { locationId, locationSlug } = useParams<{ locationId?: string; locationSlug?: string }>();
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FeedbackFormData>({
    defaultValues: {
      coffeeRating: 0,
      serviceRating: 0,
      ambianceComment: "",
      customerName: "",
      customerEmail: "",
      participateInGiveaway: false
    }
  });

  const watchedValues = watch();
  const participateInGiveaway = watch("participateInGiveaway");

  useEffect(() => {
    if (locationId || locationSlug) {
      loadLocation();
    }
  }, [locationId, locationSlug]);

  const loadLocation = async () => {
    try {
      setLoading(true);
      
      let data;
      let error;
      if (locationId) {
        ({ data, error } = await supabase
          .from('cafes_locations_mapping')
          .select('location_id, location_name, brand_color')
          .eq('location_id', locationId)
          .single());
      } else if (locationSlug) {
        const { data: loc, error: locError } = await supabase
          .from('locations')
          .select('id')
          .eq('slug', locationSlug)
          .single();
        error = locError;
        if (loc) {
          ({ data } = await supabase
            .from('cafes_locations_mapping')
            .select('location_id, location_name, brand_color')
            .eq('location_id', loc.id)
            .single());
        }
      }

      if (error || !data) {
        console.error('Error loading location:', error);
        toast.error("Ubicación no encontrada");
        return;
      }

      if (data) {
        setLocation({
          id: data.location_id,
          name: data.location_name,
          brand_color: data.brand_color || '#8B5CF6',
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error("Error al cargar información de la ubicación");
    } finally {
      setLoading(false);
    }
  };

  const handleStarClick = (field: 'coffeeRating' | 'serviceRating', selectedRating: number) => {
    setValue(field, selectedRating);
  };

  const onSubmit = async (data: FeedbackFormData) => {
    if (!location) {
      toast.error("Error: información de la ubicación no disponible");
      return;
    }

    if (!data.coffeeRating || !data.serviceRating || !data.customerName.trim()) {
      toast.error("Por favor completa todos los campos requeridos");
      return;
    }

    try {
      // Submit feedback with all ratings
      const { data: feedbackData, error: feedbackError } = await supabase
        .from('feedbacks')
        .insert({
          location_id: location.id,
          customer_name: data.customerName.trim(),
          customer_email: data.customerEmail?.trim() || null,
          rating: Math.round((data.coffeeRating + data.serviceRating) / 2),
          comment: data.ambianceComment.trim() || null
        })
        .select('id')
        .single();

      if (feedbackError) throw feedbackError;

      // Trigger both sentiment analysis and AI moderation for comments
      if (data.ambianceComment?.trim() && feedbackData?.id) {
        try {
          // First get sentiment analysis
          const sentimentResponse = await supabase.functions.invoke('analyze-sentiment', {
            body: {
              feedback_id: feedbackData.id,
              text: data.ambianceComment.trim()
            }
          });

          // Then trigger AI moderation with sentiment result
          const moderationResponse = await supabase.functions.invoke('moderate-comment', {
            body: {
              feedback_id: feedbackData.id,
              comment: data.ambianceComment.trim(),
              sentiment: sentimentResponse.data?.sentiment || null
            }
          });

          if (moderationResponse.data?.auto_approved) {
            console.log('✅ Comment auto-approved by AI moderation');
          } else {
            console.log('⚠️ Comment sent to manual moderation');
          }

        } catch (analysisError) {
          console.warn('⚠️ AI analysis failed:', analysisError);
          // Continue with success - AI analysis is not critical for feedback submission
        }
      }

      // If user wants to participate in giveaway and provided email
      if (data.participateInGiveaway && data.customerEmail?.trim()) {
        const { error: giveawayError } = await supabase
          .from('giveaway_participants')
          .insert({
            location_id: location.id,
            customer_name: data.customerName.trim(),
            customer_email: data.customerEmail.trim(),
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

  if (!location) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <Coffee className="mx-auto h-12 w-12 mb-4" />
              <p>Ubicación no encontrada</p>
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
              style={{ backgroundColor: location.brand_color }}
            >
              <MessageSquare className="h-8 w-8" />
            </div>
            <CardTitle>¡Gracias por tu feedback!</CardTitle>
            <CardDescription>
              Tu opinión es muy importante para {location.name}
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
            style={{ backgroundColor: location.brand_color }}
          >
            <Coffee className="h-8 w-8" />
          </div>
          <CardTitle>{location.name}</CardTitle>
          <CardDescription>
            Comparte tu experiencia con nosotros
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Coffee Rating */}
            <div className="text-center">
              <Label className="text-base font-medium flex items-center justify-center gap-2 mb-3">
                <Coffee className="h-5 w-5" />
                ¿Cómo estuvo el café?
              </Label>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleStarClick('coffeeRating', star)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      className={`h-8 w-8 ${
                        star <= watchedValues.coffeeRating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
              {errors.coffeeRating && (
                <p className="text-sm text-destructive mt-1">Califica el café por favor</p>
              )}
            </div>

            {/* Service Rating */}
            <div className="text-center">
              <Label className="text-base font-medium flex items-center justify-center gap-2 mb-3">
                <Users className="h-5 w-5" />
                ¿Cómo fue el servicio?
              </Label>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleStarClick('serviceRating', star)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      className={`h-8 w-8 ${
                        star <= watchedValues.serviceRating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
              {errors.serviceRating && (
                <p className="text-sm text-destructive mt-1">Califica el servicio por favor</p>
              )}
            </div>

            {/* Ambiance Comment */}
            <div>
              <Label htmlFor="ambiance" className="text-base font-medium flex items-center gap-2 mb-2">
                <Home className="h-5 w-5" />
                ¿Cómo te sentiste en el ambiente?
              </Label>
              <Textarea
                id="ambiance"
                {...register("ambianceComment", { required: "Describe el ambiente por favor" })}
                placeholder="Describe el ambiente del lugar..."
                className="min-h-[80px]"
              />
              {errors.ambianceComment && (
                <p className="text-sm text-destructive mt-1">{errors.ambianceComment.message}</p>
              )}
            </div>

            {/* Customer Info */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  {...register("customerName", { required: "El nombre es requerido" })}
                  placeholder="Tu nombre"
                />
                {errors.customerName && (
                  <p className="text-sm text-destructive mt-1">{errors.customerName.message}</p>
                )}
              </div>
            </div>

            {/* Giveaway Participation */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="giveaway"
                  {...register("participateInGiveaway")}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="giveaway" className="text-sm">
                  Quiero participar en sorteos y promociones
                </Label>
              </div>

              {participateInGiveaway && (
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register("customerEmail", { 
                      required: participateInGiveaway ? "Email requerido para participar en sorteos" : false,
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "Email inválido"
                      }
                    })}
                    placeholder="tu@email.com"
                  />
                  {errors.customerEmail && (
                    <p className="text-sm text-destructive mt-1">{errors.customerEmail.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Para contactarte si resultas ganador
                  </p>
                </div>
              )}
            </div>

            {/* Anonymous Preview */}
            {watchedValues.customerName.trim() && (
              <div className="p-3 bg-muted rounded-lg border-l-4 border-primary">
                <p className="text-sm text-muted-foreground mb-1">
                  Tu comentario se publicará como:
                </p>
                <p className="text-sm font-medium">
                  Usuario: {watchedValues.customerName.trim()}
                </p>
              </div>
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full"
              style={{ backgroundColor: location.brand_color }}
            >
              {isSubmitting ? "Enviando..." : "Enviar Feedback"}
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