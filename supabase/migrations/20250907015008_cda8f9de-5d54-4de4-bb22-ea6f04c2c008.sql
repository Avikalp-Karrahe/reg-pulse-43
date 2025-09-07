-- Enable Row Level Security on calls table
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;

-- Enable Row Level Security on issues table  
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;

-- Create policies for calls table (allow all operations for now since there's no auth yet)
CREATE POLICY "Allow all operations on calls" 
ON public.calls 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create policies for issues table (allow all operations for now since there's no auth yet)
CREATE POLICY "Allow all operations on issues" 
ON public.issues 
FOR ALL 
USING (true)
WITH CHECK (true);