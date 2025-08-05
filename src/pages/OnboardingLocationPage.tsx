import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useUserWithRole } from '@/hooks/useUserWithRole';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ContextualLoading } from '@/components/ui/loading-states';

interface Location {
  id: string;
  name: string;
  address?: string;
}

export function OnboardingLocationPage() {
  const { user, orgId, locationId, isLoading } = useUserWithRole();
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [locLoading, setLocLoading] = useState(true);
  const { toast } = useToast();

  // If user doesn't have org, redirect to main onboarding
  if (!isLoading && !orgId) {
    return <Navigate to="/onboarding" replace />;
  }

  // If user already has location, redirect to appropriate dashboard
  if (!isLoading && locationId) {
    return <Navigate to="/app" replace />;
  }

  // Load locations for user's organization
  React.useEffect(() => {
    async function loadLocations() {
      if (!orgId) return;

      try {
        const { data, error } = await supabase
          .from('locations')
          .select('id, name, address')
          .eq('group_id', orgId)
          .order('name');

        if (error) throw error;
        setLocations(data || []);
      } catch (error) {
        console.error('Error loading locations:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar las ubicaciones",
          variant: "destructive",
        });
      } finally {
        setLocLoading(false);
      }
    }

    if (orgId) {
      loadLocations();
    }
  }, [orgId, toast]);

  const handleAssignLocation = async () => {
    if (!selectedLocationId || !user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ location_id: selectedLocationId })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Ubicación asignada correctamente",
      });

      // Redirect to app
      window.location.href = '/app';
    } catch (error) {
      console.error('Error assigning location:', error);
      toast({
        title: "Error",
        description: "No se pudo asignar la ubicación",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || locLoading) {
    return <ContextualLoading type="general" message="Cargando ubicaciones..." />;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Seleccionar Ubicación</CardTitle>
          <CardDescription>
            Elige la ubicación donde trabajas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Ubicación</label>
            <Select value={selectedLocationId} onValueChange={setSelectedLocationId}>
              <SelectTrigger>
                <SelectValue placeholder="Elige tu ubicación" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    <div>
                      <div className="font-medium">{location.name}</div>
                      {location.address && (
                        <div className="text-sm text-muted-foreground">{location.address}</div>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={handleAssignLocation}
            disabled={!selectedLocationId || loading}
            className="w-full"
          >
            {loading ? "Asignando..." : "Finalizar Configuración"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}