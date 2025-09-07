-- Fix critical security vulnerability: Compliance data exposed publicly
-- Add user and organization context to secure sensitive compliance data

-- First, add user_id and organization_id columns to secure the data
ALTER TABLE public.calls 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN organization_id UUID DEFAULT gen_random_uuid();

ALTER TABLE public.issues 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN organization_id UUID;

-- Create index for performance on the new columns
CREATE INDEX idx_calls_user_id ON public.calls(user_id);
CREATE INDEX idx_calls_organization_id ON public.calls(organization_id);
CREATE INDEX idx_issues_user_id ON public.issues(user_id);
CREATE INDEX idx_issues_organization_id ON public.issues(organization_id);

-- Drop the insecure "allow all" policies
DROP POLICY IF EXISTS "Allow all operations on calls" ON public.calls;
DROP POLICY IF EXISTS "Allow all operations on issues" ON public.issues;

-- Create secure RLS policies for calls table
-- Only authenticated users can see calls from their organization
CREATE POLICY "Users can view calls from their organization" 
ON public.calls 
FOR SELECT 
TO authenticated
USING (
  user_id = auth.uid() OR 
  organization_id = (
    SELECT organization_id FROM public.calls 
    WHERE user_id = auth.uid() 
    LIMIT 1
  )
);

-- Users can only insert calls for themselves
CREATE POLICY "Users can create their own calls" 
ON public.calls 
FOR INSERT 
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can only update their own calls
CREATE POLICY "Users can update their own calls" 
ON public.calls 
FOR UPDATE 
TO authenticated
USING (user_id = auth.uid());

-- Users can only delete their own calls
CREATE POLICY "Users can delete their own calls" 
ON public.calls 
FOR DELETE 
TO authenticated
USING (user_id = auth.uid());

-- Create secure RLS policies for issues table
-- Only authenticated users can see issues from calls in their organization
CREATE POLICY "Users can view issues from their organization calls" 
ON public.issues 
FOR SELECT 
TO authenticated
USING (
  user_id = auth.uid() OR
  organization_id = (
    SELECT organization_id FROM public.calls 
    WHERE user_id = auth.uid() 
    LIMIT 1
  ) OR
  call_id IN (
    SELECT id FROM public.calls 
    WHERE organization_id = (
      SELECT organization_id FROM public.calls 
      WHERE user_id = auth.uid() 
      LIMIT 1
    )
  )
);

-- Users can only insert issues for calls they have access to
CREATE POLICY "Users can create issues for accessible calls" 
ON public.issues 
FOR INSERT 
TO authenticated
WITH CHECK (
  user_id = auth.uid() AND
  call_id IN (
    SELECT id FROM public.calls 
    WHERE user_id = auth.uid()
  )
);

-- Users can only update issues they created
CREATE POLICY "Users can update their own issues" 
ON public.issues 
FOR UPDATE 
TO authenticated
USING (user_id = auth.uid());

-- Users can only delete issues they created
CREATE POLICY "Users can delete their own issues" 
ON public.issues 
FOR DELETE 
TO authenticated
USING (user_id = auth.uid());

-- Add foreign key constraint to link issues to calls via organization
ALTER TABLE public.issues 
ADD CONSTRAINT fk_issues_organization 
FOREIGN KEY (organization_id) 
REFERENCES public.calls(organization_id);

-- Create a function to automatically set organization_id for issues
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically set organization context
CREATE TRIGGER set_issue_organization_trigger
  BEFORE INSERT ON public.issues
  FOR EACH ROW
  EXECUTE FUNCTION public.set_issue_organization();