import React from 'react';
import { useParams } from 'react-router-dom';
import { useUserWithRole } from '@/hooks/useUserWithRole';
import { supabase } from '@/integrations/supabase/client';
import { UnauthorizedAccess } from '@/components/auth/UnauthorizedAccess';
import { ContextualLoading } from '@/components/ui/loading-states';

interface OrgSlugValidatorProps {
  children: React.ReactNode;
}

export function OrgSlugValidator({ children }: OrgSlugValidatorProps) {
  const { orgSlug } = useParams();
  const { user, orgSlug: userOrgSlug, isAdmin, isLoading } = useUserWithRole();
  const [validationLoading, setValidationLoading] = React.useState(true);
  const [hasAccess, setHasAccess] = React.useState(false);

  React.useEffect(() => {
    async function validateAccess() {
      if (!orgSlug || !user || isLoading) return;

      // Admins have access to all orgs
      if (isAdmin) {
        setHasAccess(true);
        setValidationLoading(false);
        return;
      }

      try {
        // Validate using the database function
        const { data, error } = await supabase
          .rpc('validate_org_slug_access', { p_org_slug: orgSlug });

        if (error) {
          console.error('Error validating org access:', error);
          setHasAccess(false);
        } else {
          setHasAccess(data || false);
        }
      } catch (error) {
        console.error('Error in org validation:', error);
        setHasAccess(false);
      } finally {
        setValidationLoading(false);
      }
    }

    validateAccess();
  }, [orgSlug, user, isAdmin, isLoading, userOrgSlug]);

  // Show loading while validating
  if (isLoading || validationLoading) {
    return <ContextualLoading type="auth" message="Validando acceso a organización..." />;
  }

  // Show unauthorized if no access
  if (!hasAccess) {
    return (
      <UnauthorizedAccess 
        reason="Esta página pertenece a otra organización" 
        redirectTo="/app"
      />
    );
  }

  // Render children if access is granted
  return <>{children}</>;
}