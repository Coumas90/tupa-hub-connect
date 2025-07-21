-- Add certificate_url column to user_course_progress table
ALTER TABLE public.user_course_progress 
ADD COLUMN certificate_url TEXT;

-- Create storage bucket for certificates
INSERT INTO storage.buckets (id, name, public) 
VALUES ('certificates', 'certificates', true);

-- Create storage policies for certificates
CREATE POLICY "Anyone can view certificates" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'certificates');

CREATE POLICY "Users can upload their own certificates" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'certificates' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "System can manage certificates" 
ON storage.objects 
FOR ALL 
USING (bucket_id = 'certificates');