-- Create experience table
CREATE TABLE public.experience (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  is_current BOOLEAN DEFAULT false,
  description TEXT[],
  skills TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.experience ENABLE ROW LEVEL SECURITY;

-- Create policies for experience access
CREATE POLICY "Experience entries are viewable by everyone" 
ON public.experience 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert their own experience" 
ON public.experience 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own experience" 
ON public.experience 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own experience" 
ON public.experience 
FOR DELETE 
USING (auth.uid() = user_id);