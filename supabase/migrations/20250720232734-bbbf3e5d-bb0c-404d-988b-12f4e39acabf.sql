-- Create security policies for users table

-- Policy 1: Users can only access their own profile
CREATE POLICY "Users can access own profile" 
ON public.users 
FOR SELECT 
TO authenticated
USING (auth.uid() = id);

-- Policy 2: Users can update their own profile
CREATE POLICY "Users can update own profile" 
ON public.users 
FOR UPDATE 
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy 3: Admins can access all profiles (using existing is_admin function)
CREATE POLICY "Admins can access all profiles" 
ON public.users 
FOR ALL 
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Policy 4: Users can insert their own profile
CREATE POLICY "Users can insert own profile" 
ON public.users 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = id);