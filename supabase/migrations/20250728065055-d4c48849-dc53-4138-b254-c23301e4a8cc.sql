-- Create backup_logs table for tracking backup operations
CREATE TABLE public.backup_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  backup_id TEXT NOT NULL UNIQUE,
  backup_type TEXT NOT NULL,
  backup_date DATE NOT NULL,
  records_count INTEGER NOT NULL DEFAULT 0,
  file_path TEXT,
  status TEXT NOT NULL DEFAULT 'completed',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.backup_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage backup logs" 
ON public.backup_logs 
FOR ALL 
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Create index for efficient queries
CREATE INDEX idx_backup_logs_type_date ON public.backup_logs (backup_type, backup_date);
CREATE INDEX idx_backup_logs_created_at ON public.backup_logs (created_at);

-- Create storage bucket for moderation backups
INSERT INTO storage.buckets (id, name, public) 
VALUES ('moderation-backups', 'moderation-backups', false);

-- Create storage policies for backup files
CREATE POLICY "Admins can view backup files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'moderation-backups' AND is_admin(auth.uid()));

CREATE POLICY "System can upload backup files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'moderation-backups');

CREATE POLICY "System can update backup files" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'moderation-backups');

CREATE POLICY "System can delete old backup files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'moderation-backups');

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_backup_logs_updated_at
BEFORE UPDATE ON public.backup_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();