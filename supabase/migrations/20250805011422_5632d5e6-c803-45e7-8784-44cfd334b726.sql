-- Create comprehensive RLS policies for multi-tenant isolation
-- This ensures complete data isolation between organizations

-- Update users table RLS policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;

CREATE POLICY "Users can view users from same org or admins can view all"
ON public.users FOR SELECT
USING (
  is_admin(auth.uid()) OR 
  org_id = current_user_org_id()
);

CREATE POLICY "Users can update their own profile"
ON public.users FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can manage all users"
ON public.users FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Update consumptions table RLS policies
DROP POLICY IF EXISTS "Users can view consumptions from their location" ON public.consumptions;
DROP POLICY IF EXISTS "Users can insert consumptions to their location" ON public.consumptions;
DROP POLICY IF EXISTS "Users can update consumptions from their location" ON public.consumptions;

CREATE POLICY "Users can view consumptions from their org"
ON public.consumptions FOR SELECT
USING (
  is_admin(auth.uid()) OR 
  location_id IN (
    SELECT l.id FROM locations l 
    WHERE l.group_id = current_user_org_id()
  )
);

CREATE POLICY "Users can insert consumptions to their org locations"
ON public.consumptions FOR INSERT
WITH CHECK (
  is_admin(auth.uid()) OR 
  location_id IN (
    SELECT l.id FROM locations l 
    WHERE l.group_id = current_user_org_id()
  )
);

CREATE POLICY "Users can update consumptions from their org"
ON public.consumptions FOR UPDATE
USING (
  is_admin(auth.uid()) OR 
  location_id IN (
    SELECT l.id FROM locations l 
    WHERE l.group_id = current_user_org_id()
  )
);

-- Update recipes table RLS policies  
DROP POLICY IF EXISTS "Users can view recipes from their location" ON public.recipes;
DROP POLICY IF EXISTS "Users can insert recipes to their location" ON public.recipes;
DROP POLICY IF EXISTS "Users can update recipes from their location" ON public.recipes;
DROP POLICY IF EXISTS "Users can delete recipes from their location" ON public.recipes;

CREATE POLICY "Users can view recipes from their org"
ON public.recipes FOR SELECT
USING (
  is_admin(auth.uid()) OR 
  location_id IN (
    SELECT l.id FROM locations l 
    WHERE l.group_id = current_user_org_id()
  )
);

CREATE POLICY "Users can insert recipes to their org locations"
ON public.recipes FOR INSERT
WITH CHECK (
  is_admin(auth.uid()) OR 
  location_id IN (
    SELECT l.id FROM locations l 
    WHERE l.group_id = current_user_org_id()
  )
);

CREATE POLICY "Users can update recipes from their org"
ON public.recipes FOR UPDATE
USING (
  is_admin(auth.uid()) OR 
  location_id IN (
    SELECT l.id FROM locations l 
    WHERE l.group_id = current_user_org_id()
  )
)
WITH CHECK (
  is_admin(auth.uid()) OR 
  location_id IN (
    SELECT l.id FROM locations l 
    WHERE l.group_id = current_user_org_id()
  )
);

CREATE POLICY "Users can delete recipes from their org"
ON public.recipes FOR DELETE
USING (
  is_admin(auth.uid()) OR 
  location_id IN (
    SELECT l.id FROM locations l 
    WHERE l.group_id = current_user_org_id()
  )
);

-- Update orders table RLS policies
DROP POLICY IF EXISTS "Users can view orders from their location" ON public.orders;
DROP POLICY IF EXISTS "Users can insert orders to their location" ON public.orders;
DROP POLICY IF EXISTS "Users can update orders from their location" ON public.orders;
DROP POLICY IF EXISTS "Users can delete orders from their location" ON public.orders;

CREATE POLICY "Users can view orders from their org"
ON public.orders FOR SELECT
USING (
  is_admin(auth.uid()) OR 
  location_id IN (
    SELECT l.id FROM locations l 
    WHERE l.group_id = current_user_org_id()
  )
);

CREATE POLICY "Users can insert orders to their org locations"
ON public.orders FOR INSERT
WITH CHECK (
  is_admin(auth.uid()) OR 
  location_id IN (
    SELECT l.id FROM locations l 
    WHERE l.group_id = current_user_org_id()
  )
);

CREATE POLICY "Users can update orders from their org"
ON public.orders FOR UPDATE
USING (
  is_admin(auth.uid()) OR 
  location_id IN (
    SELECT l.id FROM locations l 
    WHERE l.group_id = current_user_org_id()
  )
);

CREATE POLICY "Users can delete orders from their org"
ON public.orders FOR DELETE
USING (
  is_admin(auth.uid()) OR 
  location_id IN (
    SELECT l.id FROM locations l 
    WHERE l.group_id = current_user_org_id()
  )
);

-- Create function for org slug validation
CREATE OR REPLACE FUNCTION validate_org_slug_access(p_org_slug text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM groups g
    INNER JOIN users u ON u.org_id = g.id
    WHERE u.id = auth.uid()
    AND LOWER(REPLACE(g.name, ' ', '-')) = LOWER(p_org_slug)
  ) OR is_admin(auth.uid());
$$;