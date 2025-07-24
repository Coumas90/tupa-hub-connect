import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Star, MessageSquare, Calendar, Filter } from 'lucide-react';
import { FeedbackHistoryModal } from './FeedbackHistoryModal';

interface Feedback {
  id: string;
  rating: number;
  comment: string;
  customer_name: string;
  created_at: string;
  comment_status: string;
}

interface PublicFeedbackDisplayProps {
  cafeId: string;
  className?: string;
}

type FilterType = 'all' | 'positive' | 'with_response' | 'recent';

export default function PublicFeedbackDisplay({ cafeId, className }: PublicFeedbackDisplayProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState<FilterType>('all');
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const itemsPerPage = 10;

  const { data, isLoading, error } = useQuery({
    queryKey: ['public-feedbacks', cafeId, currentPage, filter],
    queryFn: async () => {
      let query = supabase
        .from('feedbacks')
        .select('id, rating, comment, customer_name, created_at, comment_status')
        .eq('cafe_id', cafeId)
        .eq('comment_status', 'approved')
        .not('comment', 'is', null)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filter === 'positive') {
        query = query.gte('rating', 4);
      } else if (filter === 'recent') {
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);
        query = query.gte('created_at', lastWeek.toISOString());
      }

      // Calculate offset for pagination
      const offset = (currentPage - 1) * itemsPerPage;
      
      // Get total count for pagination
      const { count } = await supabase
        .from('feedbacks')
        .select('*', { count: 'exact', head: true })
        .eq('cafe_id', cafeId)
        .eq('comment_status', 'approved')
        .not('comment', 'is', null);

      // Get paginated results
      const { data: feedbacks, error } = await query
        .range(offset, offset + itemsPerPage - 1);

      if (error) throw error;

      return {
        feedbacks: feedbacks || [],
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / itemsPerPage)
      };
    },
    enabled: !!cafeId,
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

  const truncateText = (text: string, maxLength: number = 120) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getFilterLabel = (filterType: FilterType) => {
    switch (filterType) {
      case 'positive': return 'Solo Positivos';
      case 'with_response': return 'Con Respuesta';
      case 'recent': return 'Recientes';
      default: return 'Todos';
    }
  };

  if (error) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">Error al cargar los comentarios</p>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Comentarios de Clientes</h2>
          <p className="text-muted-foreground">
            {data?.totalCount || 0} comentarios aprobados
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {(['all', 'positive', 'recent'] as FilterType[]).map((filterType) => (
            <Button
              key={filterType}
              variant={filter === filterType ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setFilter(filterType);
                setCurrentPage(1);
              }}
              className="text-xs"
            >
              <Filter className="h-3 w-3 mr-1" />
              {getFilterLabel(filterType)}
            </Button>
          ))}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHistoryModal(true)}
            className="text-xs"
          >
            <Calendar className="h-3 w-3 mr-1" />
            Ver Histórico
          </Button>
        </div>
      </div>

      {/* Feedback Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-4">
              <div className="flex items-start space-x-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : data?.feedbacks.length === 0 ? (
        <Card className="p-8 text-center">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">
            {filter === 'all' 
              ? 'No hay comentarios aprobados aún' 
              : `No hay comentarios que coincidan con el filtro "${getFilterLabel(filter)}"`
            }
          </p>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data?.feedbacks.map((feedback) => (
              <Card key={feedback.id} className="p-4 hover:shadow-md transition-shadow">
                <CardContent className="p-0">
                  <div className="flex items-start space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">
                        {getInitials(feedback.customer_name || 'Cliente')}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-sm truncate">
                          {feedback.customer_name || 'Cliente Anónimo'}
                        </h4>
                        <Badge variant="secondary" className="text-xs">
                          {formatDate(feedback.created_at)}
                        </Badge>
                      </div>
                      
                      <div className="mb-2">
                        {renderStars(feedback.rating)}
                      </div>
                      
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {truncateText(feedback.comment)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 1) {
                          setCurrentPage(currentPage - 1);
                        }
                      }}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: Math.min(5, data.totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          href="#"
                          isActive={currentPage === pageNum}
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage(pageNum);
                          }}
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  
                  {data.totalPages > 5 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}
                  
                  <PaginationItem>
                    <PaginationNext 
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage < data.totalPages) {
                          setCurrentPage(currentPage + 1);
                        }
                      }}
                      className={currentPage === data.totalPages ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
      )}

      {/* History Modal */}
      <FeedbackHistoryModal
        cafeId={cafeId}
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
      />
    </div>
  );
}