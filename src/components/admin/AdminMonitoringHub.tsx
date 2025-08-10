import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Download, UserCheck, MapPin, Star, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CafeMarker {
  id: string;
  name: string;
  lat: number;
  lng: number;
  rating: number;
  negativeFeedbacks: number;
  totalFeedbacks: number;
  status: 'critical' | 'warning' | 'good';
}

interface CriticalCafe {
  id: string;
  name: string;
  negativeFeedbacks: number;
  totalFeedbacks: number;
  rating: number;
  address?: string;
}

// Simple map visualization component (placeholder for leaflet)
const SimpleMapVisualization: React.FC<{ markers: CafeMarker[] }> = ({ markers }) => {
  return (
    <div className="h-96 w-full bg-muted rounded-lg flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-green-50" />
      <div className="text-center z-10">
        <MapPin className="h-16 w-16 text-primary mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Interactive Map Placeholder</h3>
        <p className="text-muted-foreground mb-4">
          Showing {markers.length} cafe locations
        </p>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="bg-white rounded-lg p-2 shadow">
            <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-1"></div>
            <span>Good ({markers.filter(m => m.status === 'good').length})</span>
          </div>
          <div className="bg-white rounded-lg p-2 shadow">
            <div className="w-3 h-3 bg-yellow-500 rounded-full mx-auto mb-1"></div>
            <span>Warning ({markers.filter(m => m.status === 'warning').length})</span>
          </div>
          <div className="bg-white rounded-lg p-2 shadow">
            <div className="w-3 h-3 bg-red-500 rounded-full mx-auto mb-1"></div>
            <span>Critical ({markers.filter(m => m.status === 'critical').length})</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const AdminMonitoringHub: React.FC = () => {
  const [cafeMarkers, setCafeMarkers] = useState<CafeMarker[]>([]);
  const [criticalCafes, setCriticalCafes] = useState<CriticalCafe[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchCafeData();
  }, []);

  const fetchCafeData = async () => {
    try {
      setLoading(true);
      
      // Fetch cafes with their feedback data
      const { data: cafes, error: cafesError } = await supabase
        .from('cafes')
        .select(`
          id,
          name,
          address,
          feedbacks (
            id,
            rating,
            created_at
          )
        `);

      if (cafesError) throw cafesError;

      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const markers: CafeMarker[] = [];
      const critical: CriticalCafe[] = [];

      cafes?.forEach((cafe) => {
        // Mock coordinates for demo (in real app, these would be stored in the cafe record)
        const lat = 40.7128 + (Math.random() - 0.5) * 0.1;
        const lng = -74.0060 + (Math.random() - 0.5) * 0.1;

        const recentFeedbacks = cafe.feedbacks?.filter(
          f => new Date(f.created_at) >= twentyFourHoursAgo
        ) || [];

        const negativeFeedbacks = recentFeedbacks.filter(f => f.rating <= 2).length;
        const totalFeedbacks = recentFeedbacks.length;
        const avgRating = cafe.feedbacks?.length > 0 
          ? cafe.feedbacks.reduce((sum, f) => sum + f.rating, 0) / cafe.feedbacks.length 
          : 0;

        let status: 'critical' | 'warning' | 'good' = 'good';
        if (negativeFeedbacks >= 3) {
          status = 'critical';
          critical.push({
            id: cafe.id,
            name: cafe.name,
            negativeFeedbacks,
            totalFeedbacks,
            rating: avgRating,
            address: cafe.address
          });
        } else if (negativeFeedbacks >= 1) {
          status = 'warning';
        }

        markers.push({
          id: cafe.id,
          name: cafe.name,
          lat,
          lng,
          rating: avgRating,
          negativeFeedbacks,
          totalFeedbacks,
          status
        });
      });

      setCafeMarkers(markers);
      setCriticalCafes(critical.slice(0, 5)); // Top 5 critical
    } catch (error) {
      console.error('Error fetching cafe data:', error);
      toast({
        title: "Error",
        description: "Failed to load monitoring data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const assignAdvisor = async (cafeId: string, cafeName: string) => {
    try {
      // In a real app, this would assign an advisor to the cafe
      toast({
        title: "Advisor Assigned",
        description: `Advisor assigned to ${cafeName}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to assign advisor",
        variant: "destructive"
      });
    }
  };

  const exportParticipantEmails = async () => {
    try {
      setExporting(true);
      
      // Fetch all valid giveaway participants
      const { data: participants, error } = await supabase
        .from('giveaway_participants')
        .select(`
          customer_email,
          customer_name,
          phone,
          participated_at,
          cafes (name)
        `)
        .not('customer_email', 'is', null);

      if (error) throw error;

      // Create CSV content
      const csvHeader = 'Email,Name,Phone,Cafe,Participated Date\n';
      const csvRows = participants?.map((p: any) => {
        const cafeName = Array.isArray(p.cafes) ? p.cafes[0]?.name : p.cafes?.name;
        return `"${p.customer_email}","${p.customer_name}","${p.phone || ''}","${cafeName || ''}","${new Date(p.participated_at).toLocaleDateString()}"`;
      }).join('\n') || '';

      const csvContent = csvHeader + csvRows;
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `participant-emails-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export Complete",
        description: `Exported ${participants?.length || 0} participant emails`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export participant emails",
        variant: "destructive"
      });
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Monitoring Hub</h1>
          <p className="text-muted-foreground">Real-time feedback monitoring and cafe performance</p>
        </div>
        <Button 
          onClick={exportParticipantEmails}
          disabled={exporting}
          variant="outline"
        >
          <Download className="h-4 w-4 mr-2" />
          {exporting ? 'Exporting...' : 'Export Emails CSV'}
        </Button>
      </div>

      {/* Critical Alerts */}
      {criticalCafes.length > 0 && (
        <Alert className="border-destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>{criticalCafes.length} cafes</strong> need immediate attention (3+ negative feedbacks in 24h)
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Visualization */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Cafe Feedback Heatmap
            </CardTitle>
            <CardDescription>
              Color-coded visualization: Red (critical), Yellow (warning), Green (good)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SimpleMapVisualization markers={cafeMarkers} />
          </CardContent>
        </Card>

        {/* Critical Cafes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Top 5 Critical
            </CardTitle>
            <CardDescription>
              Cafes requiring immediate attention
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {criticalCafes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No critical issues detected
              </p>
            ) : (
              criticalCafes.map((cafe) => (
                <div key={cafe.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-sm">{cafe.name}</h4>
                      {cafe.address && (
                        <p className="text-xs text-muted-foreground">{cafe.address}</p>
                      )}
                    </div>
                    <Badge variant="destructive" className="text-xs">
                      Critical
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span>{cafe.rating.toFixed(1)}</span>
                    </div>
                    <span className="text-destructive">
                      {cafe.negativeFeedbacks} negative feedbacks
                    </span>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => assignAdvisor(cafe.id, cafe.name)}
                  >
                    <UserCheck className="h-3 w-3 mr-1" />
                    Assign Advisor
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Cafes</p>
                <p className="text-2xl font-bold">{cafeMarkers.length}</p>
              </div>
              <MapPin className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Critical Issues</p>
                <p className="text-2xl font-bold text-destructive">{criticalCafes.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Healthy Cafes</p>
                <p className="text-2xl font-bold text-primary">
                  {cafeMarkers.filter(m => m.status === 'good').length}
                </p>
              </div>
              <Star className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};