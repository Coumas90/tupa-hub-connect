
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AutoOrgAssignmentResult {
  loading: boolean;
  error: string | null;
  orgAssigned: boolean;
}

/**
 * Hook para asignar automáticamente organización a usuarios B2B
 * basado en su dominio de email o configuración previa
 */
export function useAutoOrgAssignment(userId?: string) {
  const [state, setState] = useState<AutoOrgAssignmentResult>({
    loading: false,
    error: null,
    orgAssigned: false
  });
  const { toast } = useToast();

  useEffect(() => {
    if (!userId) return;

    const attemptAutoAssignment = async () => {
      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        // Verificar si el usuario ya tiene org_id
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('org_id, email')
          .eq('id', userId)
          .single();

        if (userError) throw userError;

        // Si ya tiene organización, no hacer nada
        if (user.org_id) {
          setState({ loading: false, error: null, orgAssigned: true });
          return;
        }

        // Obtener el email del usuario desde auth
        const { data: authUser } = await supabase.auth.getUser();
        const userEmail = authUser.user?.email;

        if (!userEmail) {
          setState({ loading: false, error: 'Email no disponible', orgAssigned: false });
          return;
        }

        // Extraer dominio del email
        const emailDomain = userEmail.split('@')[1];

        // Buscar si existe una organización para ese dominio
        // En un sistema B2B real, tendrías una tabla de dominios permitidos
        const { data: orgs, error: orgError } = await supabase
          .from('groups')
          .select('id, name')
          .limit(1); // Por ahora, asignar a la primera organización disponible

        if (orgError) throw orgError;

        if (orgs && orgs.length > 0) {
          // Asignar automáticamente a la primera organización
          const { error: assignError } = await supabase
            .from('users')
            .update({ org_id: orgs[0].id })
            .eq('id', userId);

          if (assignError) throw assignError;

          toast({
            title: "¡Bienvenido!",
            description: `Has sido asignado a ${orgs[0].name}`,
          });

          setState({ loading: false, error: null, orgAssigned: true });
        } else {
          setState({ 
            loading: false, 
            error: 'No hay organizaciones disponibles', 
            orgAssigned: false 
          });
        }
      } catch (error: any) {
        console.error('Error in auto org assignment:', error);
        setState({ 
          loading: false, 
          error: error.message || 'Error asignando organización', 
          orgAssigned: false 
        });
      }
    };

    attemptAutoAssignment();
  }, [userId, toast]);

  return state;
}
