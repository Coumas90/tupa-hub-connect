-- Enable Row Level Security on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Enable Row Level Security on recipes table
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;

-- Enable Row Level Security on consumptions table
ALTER TABLE public.consumptions ENABLE ROW LEVEL SECURITY;