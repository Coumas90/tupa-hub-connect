-- Migrate feedbacks and giveaways from cafe_id to location_id

-- 1. Feedbacks table
ALTER TABLE public.feedbacks
  ADD COLUMN IF NOT EXISTS location_id uuid REFERENCES public.locations(id);

UPDATE public.feedbacks f
SET location_id = m.location_id
FROM public.cafes_locations_mapping m
WHERE f.cafe_id = m.cafe_id;

ALTER TABLE public.feedbacks
  ALTER COLUMN location_id SET NOT NULL;

DROP INDEX IF EXISTS idx_feedbacks_cafe_id;
ALTER TABLE public.feedbacks DROP COLUMN IF EXISTS cafe_id;
CREATE INDEX IF NOT EXISTS idx_feedbacks_location_id ON public.feedbacks(location_id);

-- RLS policies
DROP POLICY IF EXISTS "Cafe owners can view own cafe feedbacks" ON public.feedbacks;
DROP POLICY IF EXISTS "Cafe owners can manage own cafe feedbacks" ON public.feedbacks;

CREATE POLICY "Location users can view feedbacks" ON public.feedbacks
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() AND u.location_id = feedbacks.location_id
  )
);

CREATE POLICY "Location users can manage feedbacks" ON public.feedbacks
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() AND u.location_id = feedbacks.location_id
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() AND u.location_id = feedbacks.location_id
  )
);

-- 2. Giveaway participants table
ALTER TABLE public.giveaway_participants
  ADD COLUMN IF NOT EXISTS location_id uuid REFERENCES public.locations(id);

UPDATE public.giveaway_participants gp
SET location_id = m.location_id
FROM public.cafes_locations_mapping m
WHERE gp.cafe_id = m.cafe_id;

ALTER TABLE public.giveaway_participants
  ALTER COLUMN location_id SET NOT NULL;

DROP INDEX IF EXISTS idx_giveaway_participants_cafe_id;
ALTER TABLE public.giveaway_participants DROP COLUMN IF EXISTS cafe_id;
CREATE INDEX IF NOT EXISTS idx_giveaway_participants_location_id ON public.giveaway_participants(location_id);

DROP POLICY IF EXISTS "Cafe owners can view own cafe participants" ON public.giveaway_participants;
DROP POLICY IF EXISTS "Cafe owners can manage own cafe participants" ON public.giveaway_participants;

CREATE POLICY "Location users can view participants" ON public.giveaway_participants
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() AND u.location_id = giveaway_participants.location_id
  )
);

CREATE POLICY "Location users can manage participants" ON public.giveaway_participants
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() AND u.location_id = giveaway_participants.location_id
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() AND u.location_id = giveaway_participants.location_id
  )
);

-- 3. Giveaway winners table
ALTER TABLE public.giveaway_winners
  ADD COLUMN IF NOT EXISTS location_id uuid REFERENCES public.locations(id);

UPDATE public.giveaway_winners gw
SET location_id = gp.location_id
FROM public.giveaway_participants gp
WHERE gw.participant_id = gp.id;

ALTER TABLE public.giveaway_winners
  ALTER COLUMN location_id SET NOT NULL;

DROP INDEX IF EXISTS idx_giveaway_winners_cafe_id;
ALTER TABLE public.giveaway_winners DROP CONSTRAINT IF EXISTS fk_giveaway_winners_cafe;
ALTER TABLE public.giveaway_winners DROP COLUMN IF EXISTS cafe_id;
CREATE INDEX IF NOT EXISTS idx_giveaway_winners_location_id ON public.giveaway_winners(location_id);

DROP POLICY IF EXISTS "Cafe owners can view their cafe winners" ON public.giveaway_winners;
CREATE POLICY "Location users can view winners" ON public.giveaway_winners
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() AND u.location_id = giveaway_winners.location_id
  )
);
