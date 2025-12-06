-- Create ML Models Showcase table
CREATE TABLE public.ml_models (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  model_type TEXT, -- e.g., 'Classification', 'NLP', 'Computer Vision', 'Reinforcement Learning'
  framework TEXT, -- e.g., 'PyTorch', 'TensorFlow', 'scikit-learn'
  dataset TEXT, -- Dataset used for training
  metrics JSONB DEFAULT '{}', -- e.g., {"accuracy": "95%", "f1_score": "0.92"}
  github_url TEXT,
  demo_url TEXT,
  paper_url TEXT,
  image_url TEXT,
  technologies TEXT[] DEFAULT '{}',
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.ml_models ENABLE ROW LEVEL SECURITY;

-- Create policies for ML models
CREATE POLICY "ML models are viewable by everyone" 
ON public.ml_models 
FOR SELECT 
USING (true);

CREATE POLICY "Owners can insert ml_models" 
ON public.ml_models 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Owners can update ml_models" 
ON public.ml_models 
FOR UPDATE 
USING (has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Owners can delete ml_models" 
ON public.ml_models 
FOR DELETE 
USING (has_role(auth.uid(), 'owner'::app_role));