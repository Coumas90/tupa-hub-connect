-- 1) Link groups to clients for tenant org mapping
-- Add client_id to groups (nullable for backward compatibility)
ALTER TABLE public.groups
ADD COLUMN IF NOT EXISTS client_id uuid;

-- Create index for faster lookups by client
CREATE INDEX IF NOT EXISTS idx_groups_client_id ON public.groups(client_id);

-- Note: We intentionally avoid adding a foreign key here to prevent lock/restore issues if clients are seeded differently.
-- You can add a FK later once data is consistent:
-- ALTER TABLE public.groups
--   ADD CONSTRAINT fk_groups_client
--   FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL;
