import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, XCircle, Shield, Clock, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface PendingReview {
  id: string;
  feedback_id: string;
  original_comment: string;
  toxicity_score: number | null;
  sentiment_result: string | null;
  needs_validation: boolean;
  is_approved: boolean | null;
  auto_approved: boolean;
  moderation_reason: string | null;
  created_at: string;
  feedbacks?: {
    customer_name: string | null;
    customer_email: string | null;
    rating: number | null;
  };
}

export function ModerationPanel() {
  const [pendingReviews, setPendingReviews] = useState<PendingReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchPendingReviews();
  }, []);

  const fetchPendingReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('pending_reviews')
        .select(`
          *,
          feedbacks (
            customer_name,
            customer_email,
            rating
          )
        `)
        .eq('needs_validation', true)
        .is('is_approved', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPendingReviews(data || []);
    } catch (error) {
      console.error('Error fetching pending reviews:', error);
      toast({
        title: "Error",
        description: "Failed to load pending reviews",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleModerationAction = async (
    reviewId: string,
    action: 'approve' | 'reject' | 'block'
  ) => {
    setProcessing(reviewId);
    
    try {
      const isApproved = action === 'approve';
      const shouldBlock = action === 'block';

      // Update pending review
      const { error: reviewError } = await supabase
        .from('pending_reviews')
        .update({
          is_approved: isApproved,
          needs_validation: false,
          reviewed_at: new Date().toISOString(),
          reviewed_by: (await supabase.auth.getUser()).data.user?.id,
          moderation_reason: shouldBlock ? 'Blocked by moderator' : null
        })
        .eq('id', reviewId);

      if (reviewError) throw reviewError;

      // Update feedback status
      const review = pendingReviews.find(r => r.id === reviewId);
      if (review) {
        const feedbackStatus = shouldBlock ? 'blocked' : 
                              isApproved ? 'approved' : 'rejected';
        
        const { error: feedbackError } = await supabase
          .from('feedbacks')
          .update({ comment_status: feedbackStatus })
          .eq('id', review.feedback_id);

        if (feedbackError) throw feedbackError;
      }

      toast({
        title: "Success",
        description: `Review ${action}d successfully`,
      });

      // Refresh the list
      fetchPendingReviews();
    } catch (error) {
      console.error('Error processing moderation action:', error);
      toast({
        title: "Error",
        description: `Failed to ${action} review`,
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  const getToxicityBadge = (score: number | null) => {
    if (!score) return null;
    
    if (score < 10) return <Badge variant="secondary" className="bg-green-100 text-green-800">Low Risk</Badge>;
    if (score < 30) return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Medium Risk</Badge>;
    return <Badge variant="destructive">High Risk</Badge>;
  };

  const getSentimentBadge = (sentiment: string | null) => {
    if (!sentiment) return null;
    
    switch (sentiment) {
      case 'positive':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Positive</Badge>;
      case 'negative':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Negative</Badge>;
      case 'neutral':
        return <Badge variant="outline">Neutral</Badge>;
      default:
        return <Badge variant="outline">{sentiment}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Content Moderation Panel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-muted-foreground">Loading pending reviews...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Content Moderation Panel
          </CardTitle>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {pendingReviews.length} pending reviews
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {pendingReviews.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">All Clear!</h3>
              <p className="text-muted-foreground">No pending reviews require moderation.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Review comments carefully following the Moderation SOP guidelines. Consider toxicity scores, sentiment, and context before making decisions.
                </AlertDescription>
              </Alert>
              
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Comment</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>AI Analysis</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingReviews.map((review) => (
                      <TableRow key={review.id}>
                        <TableCell className="max-w-xs">
                          <div className="space-y-2">
                            <p className="text-sm">{review.original_comment}</p>
                            {review.moderation_reason && (
                              <p className="text-xs text-muted-foreground italic">
                                Reason: {review.moderation_reason}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{review.feedbacks?.customer_name || 'Anonymous'}</div>
                            <div className="text-muted-foreground text-xs">
                              {review.feedbacks?.customer_email}
                            </div>
                            {review.feedbacks?.rating && (
                              <div className="text-xs">
                                Rating: {review.feedbacks.rating}/5
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {getToxicityBadge(review.toxicity_score)}
                            {getSentimentBadge(review.sentiment_result)}
                            {review.toxicity_score && (
                              <div className="text-xs text-muted-foreground">
                                Toxicity: {review.toxicity_score.toFixed(1)}%
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(review.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 border-green-200 hover:bg-green-50"
                              onClick={() => handleModerationAction(review.id, 'approve')}
                              disabled={processing === review.id}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-200 hover:bg-red-50"
                              onClick={() => handleModerationAction(review.id, 'reject')}
                              disabled={processing === review.id}
                            >
                              <XCircle className="h-3 w-3 mr-1" />
                              Reject
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-orange-600 border-orange-200 hover:bg-orange-50"
                              onClick={() => handleModerationAction(review.id, 'block')}
                              disabled={processing === review.id}
                            >
                              <Shield className="h-3 w-3 mr-1" />
                              Block
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}