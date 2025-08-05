import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useUserWithRole } from '@/hooks/useUserWithRole';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ContextualLoading } from '@/components/ui/loading-states';

interface Organization {
  id: string;
  name: string;
}

export function OnboardingPage() {
  const { user, orgId, isLoading } = useUserWithRole();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [orgLoading, setOrgLoading] = useState(true);
  const { toast } = useToast();

  // If user already has org, redirect to location onboarding
  if (!isLoading && orgId) {
    return <Navigate to="/onboarding/location" replace />;
  }

  // Load organizations on mount
  React.useEffect(() => {
    async function loadOrganizations() {
      try {
        const { data, error } = await supabase
          .from('groups')
          .select('id, name')
          .order('name');

        if (error) throw error;
        setOrganizations(data || []);
      } catch (error) {
        console.error('Error loading organizations:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar las organizaciones",
          variant: "destructive",
        });
      } finally {
        setOrgLoading(false);
      }
    }

    if (user) {
      loadOrganizations();
    }
  }, [user, toast]);

  const handleAssignOrg = async () => {
    if (!selectedOrgId || !user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ org_id: selectedOrgId })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Organización asignada correctamente",
      });

      // Redirect to location onboarding
      window.location.href = '/onboarding/location';
    } catch (error) {
      console.error('Error assigning organization:', error);
      toast({
        title: "Error",
        description: "No se pudo asignar la organización",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || orgLoading) {
    return <ContextualLoading type="general" message="Cargando configuración..." />;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Bienvenido a TUPÁ Hub</CardTitle>
          <CardDescription>
            Necesitamos asignar tu organización para continuar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Seleccionar Organización</label>
            <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
              <SelectTrigger>
                <SelectValue placeholder="Elige tu organización" />
              </SelectTrigger>
              <SelectContent>
                {organizations.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={handleAssignOrg}
            disabled={!selectedOrgId || loading}
            className="w-full"
          >
            {loading ? "Asignando..." : "Continuar"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}