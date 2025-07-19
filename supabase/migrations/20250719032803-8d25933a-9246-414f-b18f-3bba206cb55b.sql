-- Mejores políticas RLS para client_configs
DROP POLICY IF EXISTS "Allow all operations on client_configs" ON public.client_configs;

-- Solo usuarios autenticados pueden leer configuraciones
CREATE POLICY "Authenticated users can read client configs" 
ON public.client_configs 
FOR SELECT 
TO authenticated 
USING (true);

-- Solo usuarios autenticados pueden crear/modificar configuraciones
CREATE POLICY "Authenticated users can modify client configs" 
ON public.client_configs 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Mejores políticas RLS para integration_logs
DROP POLICY IF EXISTS "Allow all operations on integration_logs" ON public.integration_logs;

-- Solo usuarios autenticados pueden leer logs
CREATE POLICY "Authenticated users can read integration logs" 
ON public.integration_logs 
FOR SELECT 
TO authenticated 
USING (true);

-- Solo usuarios autenticados pueden crear logs
CREATE POLICY "Authenticated users can create integration logs" 
ON public.integration_logs 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Crear tabla para roles de usuario (admin vs user)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL DEFAULT 'user',
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id)
);

-- RLS para user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Solo el propio usuario puede ver su rol
CREATE POLICY "Users can view own role" 
ON public.user_roles 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- Función helper para verificar roles
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id AND role = 'admin'
  );
$$;