import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { 
  Coffee, 
  Users, 
  MessageSquare, 
  TrendingUp, 
  Send, 
  Star,
  Gift,
  Timer
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface DashboardStats {
  avgRating: number;
  totalFeedbacks: number;
  giveawayParticipation: number;
  totalParticipants: number;
}

interface RecentFeedback {
  id: string;
  rating: number;
  comment: string;
  customer_name: string;
  created_at: string;
  has_response?: boolean;
}

interface CafeOwnerDashboardProps {
  cafeId: string;
  className?: string;
}

export default function CafeOwnerDashboard({ cafeId, className }: CafeOwnerDashboardProps) {
  const [recentFeedbacks, setRecentFeedbacks] = useState<RecentFeedback[]>([]);
  const [newFeedbackAnimation, setNewFeedbackAnimation] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');
  const [selectedFeedbackId, setSelectedFeedbackId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['cafe-stats', cafeId],
    queryFn: async (): Promise<DashboardStats> => {
      // Get feedback stats
      const { data: feedbacks, error: feedbackError } = await supabase
        .from('feedbacks')
        .select('rating')
        .eq('cafe_id', cafeId)
        .eq('comment_status', 'approved');

      if (feedbackError) throw feedbackError;

      // Get giveaway participation stats
      const { data: participants, error: participantError } = await supabase
        .from('giveaway_participants')
        .select('id')
        .eq('cafe_id', cafeId);

      if (participantError) throw participantError;

      const totalFeedbacks = feedbacks?.length || 0;
      const avgRating = totalFeedbacks > 0 
        ? feedbacks.reduce((sum, f) => sum + f.rating, 0) / totalFeedbacks 
        : 0;

      return {
        avgRating: Math.round(avgRating * 10) / 10,
        totalFeedbacks,
        giveawayParticipation: Math.round((participants?.length || 0) / Math.max(totalFeedbacks, 1) * 100),
        totalParticipants: participants?.length || 0
      };
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch recent feedbacks
  const { data: feedbacks, isLoading: feedbacksLoading } = useQuery({
    queryKey: ['recent-feedbacks', cafeId],
    queryFn: async (): Promise<RecentFeedback[]> => {
      const { data, error } = await supabase
        .from('feedbacks')
        .select('id, rating, comment, customer_name, created_at')
        .eq('cafe_id', cafeId)
        .eq('comment_status', 'approved')
        .not('comment', 'is', null)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data || [];
    },
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Set up real-time subscription for new feedbacks
  useEffect(() => {
    if (!cafeId) return;

    const channel = supabase
      .channel('cafe-feedbacks')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'feedbacks',
          filter: `cafe_id=eq.${cafeId}`
        },
        (payload) => {
          console.log('New feedback received:', payload);
          
          // Show slide-in animation
          setNewFeedbackAnimation(payload.new.id);
          setTimeout(() => setNewFeedbackAnimation(null), 3000);

          // Refresh data
          queryClient.invalidateQueries({ queryKey: ['cafe-stats', cafeId] });
          queryClient.invalidateQueries({ queryKey: ['recent-feedbacks', cafeId] });

          // Show toast notification
          toast({
            title: "¡Nuevo comentario!",
            description: `${payload.new.customer_name || 'Un cliente'} dejó una calificación de ${payload.new.rating} estrellas`,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'feedbacks',
          filter: `cafe_id=eq.${cafeId}`
        },
        (payload) => {
          console.log('Feedback updated:', payload);
          queryClient.invalidateQueries({ queryKey: ['recent-feedbacks', cafeId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [cafeId, queryClient]);

  // Update recent feedbacks when query data changes
  useEffect(() => {
    if (feedbacks) {
      setRecentFeedbacks(feedbacks);
    }
  }, [feedbacks]);

  // Publish response mutation
  const publishResponseMutation = useMutation({
    mutationFn: async ({ feedbackId, response }: { feedbackId: string; response: string }) => {
      // Here you would implement the actual response publishing logic
      // For now, we'll simulate it with a simple update
      const { error } = await supabase
        .from('feedbacks')
        .update({ 
          // Add a responses field or create a separate responses table
          // For demo purposes, we'll just mark it as having a response
          sentiment: `responded_${new Date().getTime()}`
        })
        .eq('id', feedbackId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Respuesta publicada",
        description: "Tu respuesta ha sido publicada exitosamente",
      });
      setResponseText('');
      setSelectedFeedbackId(null);
      queryClient.invalidateQueries({ queryKey: ['recent-feedbacks', cafeId] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo publicar la respuesta",
        variant: "destructive",
      });
      console.error('Error publishing response:', error);
    },
  });

  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const handlePublishResponse = () => {
    if (!selectedFeedbackId || !responseText.trim()) return;
    
    publishResponseMutation.mutate({
      feedbackId: selectedFeedbackId,
      response: responseText.trim()
    });
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard en Vivo</h1>
          <p className="text-muted-foreground">Monitoreo en tiempo real de tu café</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-muted-foreground">En vivo</span>
          </div>
        </div>
      </div>

      {/* Stats Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Average Rating */}
        <Card className="shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Calificación Promedio</CardTitle>
            <Coffee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="flex items-center space-x-2">
                <div className="text-2xl font-bold">{stats?.avgRating || 0}</div>
                <div className="flex">
                  {renderStars(Math.round(stats?.avgRating || 0))}
                </div>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              {statsLoading ? (
                <Skeleton className="h-3 w-20" />
              ) : (
                `${stats?.totalFeedbacks || 0} comentarios`
              )}
            </p>
          </CardContent>
        </Card>

        {/* Service Rating */}
        <Card className="shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Satisfacción General</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">
                {stats?.avgRating ? Math.round(stats.avgRating * 20) : 0}%
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Basado en calificaciones
            </p>
          </CardContent>
        </Card>

        {/* Giveaway Participation */}
        <Card className="shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Participación Sorteos</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats?.giveawayParticipation || 0}%</div>
            )}
            <p className="text-xs text-muted-foreground">
              {statsLoading ? (
                <Skeleton className="h-3 w-20" />
              ) : (
                `${stats?.totalParticipants || 0} participantes`
              )}
            </p>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actividad Reciente</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {feedbacksLoading ? (
                <Skeleton className="h-8 w-8" />
              ) : (
                recentFeedbacks.length
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Últimos comentarios
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Feedbacks */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5" />
            <span>Últimos Comentarios</span>
            <Badge variant="secondary" className="ml-auto">
              {recentFeedbacks.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {feedbacksLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-start space-x-3 p-3 rounded-lg border">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : recentFeedbacks.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No hay comentarios recientes</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentFeedbacks.map((feedback) => (
                <div
                  key={feedback.id}
                  className={`p-4 rounded-lg border transition-all duration-500 ${
                    newFeedbackAnimation === feedback.id
                      ? 'animate-in slide-in-from-right-4 bg-primary/5 border-primary/20'
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">
                        {getInitials(feedback.customer_name || 'Cliente')}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-sm">
                          {feedback.customer_name || 'Cliente Anónimo'}
                        </h4>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs">
                            {format(new Date(feedback.created_at), 'dd MMM, HH:mm', { locale: es })}
                          </Badge>
                          {newFeedbackAnimation === feedback.id && (
                            <Badge variant="default" className="animate-pulse">
                              ¡Nuevo!
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="mb-2">
                        {renderStars(feedback.rating)}
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-3">
                        {feedback.comment}
                      </p>

                      <div className="flex justify-end">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedFeedbackId(feedback.id)}
                            >
                              <Send className="h-3 w-3 mr-1" />
                              Responder
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Responder a {feedback.customer_name}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="p-3 bg-muted/50 rounded-lg">
                                <div className="flex items-center space-x-2 mb-2">
                                  {renderStars(feedback.rating)}
                                </div>
                                <p className="text-sm">{feedback.comment}</p>
                              </div>
                              
                              <div>
                                <Textarea
                                  placeholder="Escribe tu respuesta pública (máximo 140 caracteres)..."
                                  value={responseText}
                                  onChange={(e) => setResponseText(e.target.value.slice(0, 140))}
                                  maxLength={140}
                                  rows={3}
                                />
                                <div className="flex justify-between items-center mt-2">
                                  <span className="text-xs text-muted-foreground">
                                    {responseText.length}/140 caracteres
                                  </span>
                                  <Button
                                    onClick={handlePublishResponse}
                                    disabled={!responseText.trim() || publishResponseMutation.isPending}
                                    size="sm"
                                  >
                                    {publishResponseMutation.isPending ? (
                                      <>
                                        <Timer className="h-3 w-3 mr-1 animate-spin" />
                                        Publicando...
                                      </>
                                    ) : (
                                      <>
                                        <Send className="h-3 w-3 mr-1" />
                                        Publicar Respuesta
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}