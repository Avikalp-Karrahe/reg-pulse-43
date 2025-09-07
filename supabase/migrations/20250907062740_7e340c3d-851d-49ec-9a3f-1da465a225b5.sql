-- Fix security warning: Function Search Path Mutable
-- Update function to use immutable search path

CREATE OR REPLACE FUNCTION public.set_issue_organization()
RETURNS TRIGGER AS $$
BEGIN
  -- Set organization_id from the related call
  SELECT organization_id INTO NEW.organization_id
  FROM public.calls 
  WHERE id = NEW.call_id;
  
  -- Set user_id to current user if not set
  IF NEW.user_id IS NULL THEN
    NEW.user_id = auth.uid();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;