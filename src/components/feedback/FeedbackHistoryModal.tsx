import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Star, Search, Calendar, Download } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface FeedbackHistoryModalProps {
  cafeId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface Feedback {
  id: string;
  rating: number;
  comment: string;
  customer_name: string;
  customer_email: string;
  created_at: string;
  comment_status: string;
}

export function FeedbackHistoryModal({ cafeId, isOpen, onClose }: FeedbackHistoryModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data: feedbacks, isLoading } = useQuery({
    queryKey: ['feedback-history', cafeId, searchTerm, startDate, endDate],
    queryFn: async () => {
      let query = supabase
        .from('feedbacks')
        .select('id, rating, comment, customer_name, customer_email, created_at, comment_status')
        .eq('cafe_id', cafeId)
        .eq('comment_status', 'approved')
        .not('comment', 'is', null)
        .order('created_at', { ascending: false });

      // Apply date filters
      if (startDate) {
        query = query.gte('created_at', new Date(startDate).toISOString());
      }
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        query = query.lte('created_at', endDateTime.toISOString());
      }

      const { data, error } = await query.limit(100);

      if (error) throw error;

      // Filter by search term locally (for customer name or comment content)
      let filteredData = data || [];
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filteredData = filteredData.filter(feedback =>
          feedback.customer_name?.toLowerCase().includes(term) ||
          feedback.comment?.toLowerCase().includes(term)
        );
      }

      return filteredData;
    },
    enabled: isOpen && !!cafeId,
  });

  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-3 w-3 ${
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

  const exportToCSV = () => {
    if (!feedbacks || feedbacks.length === 0) return;

    const headers = ['Fecha', 'Cliente', 'Calificación', 'Comentario', 'Email'];
    const csvContent = [
      headers.join(','),
      ...feedbacks.map(feedback => [
        format(new Date(feedback.created_at), 'dd/MM/yyyy HH:mm', { locale: es }),
        `"${feedback.customer_name || 'Anónimo'}"`,
        feedback.rating,
        `"${feedback.comment?.replace(/"/g, '""') || ''}"`,
        `"${feedback.customer_email || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `feedback-history-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Histórico Completo de Comentarios
          </DialogTitle>
        </DialogHeader>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted/20 rounded-lg">
          <div>
            <Label htmlFor="search">Buscar</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Cliente o comentario..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="start-date">Fecha inicio</Label>
            <Input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="end-date">Fecha fin</Label>
            <Input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          
          <div className="flex flex-col gap-2">
            <Label>&nbsp;</Label>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Limpiar
              </Button>
              <Button variant="outline" size="sm" onClick={exportToCSV} disabled={!feedbacks?.length}>
                <Download className="h-4 w-4 mr-1" />
                CSV
              </Button>
            </div>
          </div>
        </div>

        {/* Results */}
        <ScrollArea className="flex-1 px-1">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Card key={i} className="p-4">
                  <div className="flex items-start space-x-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="flex justify-between">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-3/4" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : feedbacks?.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                No se encontraron comentarios con los filtros aplicados
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {feedbacks?.map((feedback) => (
                <Card key={feedback.id} className="p-4">
                  <CardContent className="p-0">
                    <div className="flex items-start space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary text-sm">
                          {getInitials(feedback.customer_name || 'Cliente')}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="font-medium text-sm">
                              {feedback.customer_name || 'Cliente Anónimo'}
                            </h4>
                            {feedback.customer_email && (
                              <p className="text-xs text-muted-foreground">
                                {feedback.customer_email}
                              </p>
                            )}
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {format(new Date(feedback.created_at), 'dd MMM yyyy, HH:mm', { locale: es })}
                          </Badge>
                        </div>
                        
                        <div className="mb-2">
                          {renderStars(feedback.rating)}
                        </div>
                        
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {feedback.comment}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {feedbacks && feedbacks.length > 0 && (
          <div className="border-t pt-4 text-sm text-muted-foreground text-center">
            Mostrando {feedbacks.length} comentarios
            {(searchTerm || startDate || endDate) && ' (filtrados)'}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}