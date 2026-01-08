-- Create a function to notify on project changes
CREATE OR REPLACE FUNCTION public.notify_project_change()
RETURNS TRIGGER AS $$
DECLARE
  payload json;
BEGIN
  -- Build the payload
  payload := json_build_object(
    'type', TG_OP,
    'table', TG_TABLE_NAME,
    'record', row_to_json(NEW),
    'old_record', CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE NULL END
  );
  
  -- Use pg_notify for webhook-like functionality
  PERFORM pg_notify('project_changes', payload::text);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for INSERT and UPDATE on projects table
DROP TRIGGER IF EXISTS trigger_project_change ON public.projects;
CREATE TRIGGER trigger_project_change
  AFTER INSERT OR UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_project_change();

-- Do the same for ml_models since they also have github_url
CREATE OR REPLACE FUNCTION public.notify_ml_model_change()
RETURNS TRIGGER AS $$
DECLARE
  payload json;
BEGIN
  payload := json_build_object(
    'type', TG_OP,
    'table', TG_TABLE_NAME,
    'record', row_to_json(NEW),
    'old_record', CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE NULL END
  );
  
  PERFORM pg_notify('ml_model_changes', payload::text);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_ml_model_change ON public.ml_models;
CREATE TRIGGER trigger_ml_model_change
  AFTER INSERT OR UPDATE ON public.ml_models
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_ml_model_change();

-- Same for llm_projects
CREATE OR REPLACE FUNCTION public.notify_llm_project_change()
RETURNS TRIGGER AS $$
DECLARE
  payload json;
BEGIN
  payload := json_build_object(
    'type', TG_OP,
    'table', TG_TABLE_NAME,
    'record', row_to_json(NEW),
    'old_record', CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE NULL END
  );
  
  PERFORM pg_notify('llm_project_changes', payload::text);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;