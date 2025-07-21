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
DROP TRIGGER IF EXISTS audit_locations ON public.locations;
CREATE TRIGGER audit_locations
  BEFORE INSERT OR UPDATE ON public.locations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_audit_fields();

DROP TRIGGER IF EXISTS audit_groups ON public.groups;
CREATE TRIGGER audit_groups
  BEFORE INSERT OR UPDATE ON public.groups
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_audit_fields();

DROP TRIGGER IF EXISTS audit_users ON public.users;
CREATE TRIGGER audit_users
  BEFORE INSERT OR UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_audit_fields();

DROP TRIGGER IF EXISTS audit_instructors ON public.instructors;
CREATE TRIGGER audit_instructors
  BEFORE INSERT OR UPDATE ON public.instructors
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_audit_fields();

DROP TRIGGER IF EXISTS audit_course_modules ON public.course_modules;
CREATE TRIGGER audit_course_modules
  BEFORE INSERT OR UPDATE ON public.course_modules
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_audit_fields();

DROP TRIGGER IF EXISTS audit_quizzes ON public.quizzes;
CREATE TRIGGER audit_quizzes
  BEFORE INSERT OR UPDATE ON public.quizzes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_audit_fields();

DROP TRIGGER IF EXISTS audit_quiz_questions ON public.quiz_questions;
CREATE TRIGGER audit_quiz_questions
  BEFORE INSERT OR UPDATE ON public.quiz_questions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_audit_fields();

DROP TRIGGER IF EXISTS audit_user_course_progress ON public.user_course_progress;
CREATE TRIGGER audit_user_course_progress
  BEFORE INSERT OR UPDATE ON public.user_course_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_audit_fields();

DROP TRIGGER IF EXISTS audit_user_quiz_attempts ON public.user_quiz_attempts;
CREATE TRIGGER audit_user_quiz_attempts
  BEFORE INSERT OR UPDATE ON public.user_quiz_attempts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_audit_fields();

DROP TRIGGER IF EXISTS audit_client_configs ON public.client_configs;
CREATE TRIGGER audit_client_configs
  BEFORE INSERT OR UPDATE ON public.client_configs
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_audit_fields();

DROP TRIGGER IF EXISTS audit_integration_logs ON public.integration_logs;
CREATE TRIGGER audit_integration_logs
  BEFORE INSERT OR UPDATE ON public.integration_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_audit_fields();

DROP TRIGGER IF EXISTS audit_pos_sync_logs ON public.pos_sync_logs;
CREATE TRIGGER audit_pos_sync_logs
  BEFORE INSERT OR UPDATE ON public.pos_sync_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_audit_fields();

DROP TRIGGER IF EXISTS audit_pos_sync_status ON public.pos_sync_status;
CREATE TRIGGER audit_pos_sync_status
  BEFORE INSERT OR UPDATE ON public.pos_sync_status
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_audit_fields();