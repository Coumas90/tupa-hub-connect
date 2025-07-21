-- Add audit fields to tables that don't have them yet
ALTER TABLE public.locations 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

ALTER TABLE public.groups 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

ALTER TABLE public.instructors 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

ALTER TABLE public.course_modules 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

ALTER TABLE public.quizzes 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

ALTER TABLE public.quiz_questions 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

ALTER TABLE public.user_course_progress 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

ALTER TABLE public.user_quiz_attempts 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

ALTER TABLE public.client_configs 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

ALTER TABLE public.integration_logs 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

ALTER TABLE public.pos_sync_logs 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

ALTER TABLE public.pos_sync_status 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- Add triggers for automatic audit field population on new tables
CREATE TRIGGER IF NOT EXISTS audit_locations
  BEFORE INSERT OR UPDATE ON public.locations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_audit_fields();

CREATE TRIGGER IF NOT EXISTS audit_groups
  BEFORE INSERT OR UPDATE ON public.groups
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_audit_fields();

CREATE TRIGGER IF NOT EXISTS audit_users
  BEFORE INSERT OR UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_audit_fields();

CREATE TRIGGER IF NOT EXISTS audit_instructors
  BEFORE INSERT OR UPDATE ON public.instructors
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_audit_fields();

CREATE TRIGGER IF NOT EXISTS audit_courses
  BEFORE INSERT OR UPDATE ON public.courses
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_audit_fields();

CREATE TRIGGER IF NOT EXISTS audit_course_modules
  BEFORE INSERT OR UPDATE ON public.course_modules
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_audit_fields();

CREATE TRIGGER IF NOT EXISTS audit_quizzes
  BEFORE INSERT OR UPDATE ON public.quizzes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_audit_fields();

CREATE TRIGGER IF NOT EXISTS audit_quiz_questions
  BEFORE INSERT OR UPDATE ON public.quiz_questions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_audit_fields();

CREATE TRIGGER IF NOT EXISTS audit_user_course_progress
  BEFORE INSERT OR UPDATE ON public.user_course_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_audit_fields();

CREATE TRIGGER IF NOT EXISTS audit_user_quiz_attempts
  BEFORE INSERT OR UPDATE ON public.user_quiz_attempts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_audit_fields();

CREATE TRIGGER IF NOT EXISTS audit_client_configs
  BEFORE INSERT OR UPDATE ON public.client_configs
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_audit_fields();

CREATE TRIGGER IF NOT EXISTS audit_integration_logs
  BEFORE INSERT OR UPDATE ON public.integration_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_audit_fields();

CREATE TRIGGER IF NOT EXISTS audit_pos_sync_logs
  BEFORE INSERT OR UPDATE ON public.pos_sync_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_audit_fields();

CREATE TRIGGER IF NOT EXISTS audit_pos_sync_status
  BEFORE INSERT OR UPDATE ON public.pos_sync_status
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_audit_fields();