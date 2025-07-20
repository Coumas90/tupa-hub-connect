-- Create security policies for recipes table with location-based access

-- Policy 1: Users can view recipes from their assigned location
CREATE POLICY "Users can view recipes from their location" 
ON public.recipes 
FOR SELECT 
TO authenticated
USING (
  location_id IN (
    SELECT location_id 
    FROM public.users 
    WHERE id = auth.uid()
  )
);

-- Policy 2: Users can insert recipes to their assigned location
CREATE POLICY "Users can insert recipes to their location" 
ON public.recipes 
FOR INSERT 
TO authenticated
WITH CHECK (
  location_id IN (
    SELECT location_id 
    FROM public.users 
    WHERE id = auth.uid()
  )
);

-- Policy 3: Users can update recipes from their assigned location
CREATE POLICY "Users can update recipes from their location" 
ON public.recipes 
FOR UPDATE 
TO authenticated
USING (
  location_id IN (
    SELECT location_id 
    FROM public.users 
    WHERE id = auth.uid()
  )
)
WITH CHECK (
  location_id IN (
    SELECT location_id 
    FROM public.users 
    WHERE id = auth.uid()
  )
);

-- Policy 4: Users can delete recipes from their assigned location
CREATE POLICY "Users can delete recipes from their location" 
ON public.recipes 
FOR DELETE 
TO authenticated
USING (
  location_id IN (
    SELECT location_id 
    FROM public.users 
    WHERE id = auth.uid()
  )
);

-- Policy 5: Admins can access all recipes (override location restrictions)
CREATE POLICY "Admins can access all recipes" 
ON public.recipes 
FOR ALL 
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));