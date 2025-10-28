-- Create enum for roles
CREATE TYPE public.app_role AS ENUM ('owner', 'viewer');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to automatically assign owner role to specific email
CREATE OR REPLACE FUNCTION public.assign_owner_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only assign owner role to ritvik.indupuri@gmail.com
  IF NEW.email = 'ritvik.indupuri@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'owner')
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    -- All other users get viewer role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'viewer')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger to assign roles on user creation
CREATE TRIGGER on_auth_user_created_assign_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_owner_role();

-- RLS Policies for user_roles table
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Only service role can insert roles"
ON public.user_roles
FOR INSERT
TO service_role
WITH CHECK (true);

-- Update existing table policies to check for owner role
-- Profiles
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Owners can insert profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Owners can update profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'owner'));

-- Skills
DROP POLICY IF EXISTS "Authenticated users can insert skills" ON public.skills;
DROP POLICY IF EXISTS "Users can update their own skills" ON public.skills;
DROP POLICY IF EXISTS "Users can delete their own skills" ON public.skills;

CREATE POLICY "Owners can insert skills"
ON public.skills
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Owners can update skills"
ON public.skills
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Owners can delete skills"
ON public.skills
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'owner'));

-- Experience
DROP POLICY IF EXISTS "Authenticated users can insert experience" ON public.experience;
DROP POLICY IF EXISTS "Users can update their own experience" ON public.experience;
DROP POLICY IF EXISTS "Users can delete their own experience" ON public.experience;

CREATE POLICY "Owners can insert experience"
ON public.experience
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Owners can update experience"
ON public.experience
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Owners can delete experience"
ON public.experience
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'owner'));

-- Projects
DROP POLICY IF EXISTS "Authenticated users can insert projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON public.projects;

CREATE POLICY "Owners can insert projects"
ON public.projects
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Owners can update projects"
ON public.projects
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Owners can delete projects"
ON public.projects
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'owner'));

-- Certifications
DROP POLICY IF EXISTS "Authenticated users can insert certifications" ON public.certifications;
DROP POLICY IF EXISTS "Users can update their own certifications" ON public.certifications;
DROP POLICY IF EXISTS "Users can delete their own certifications" ON public.certifications;

CREATE POLICY "Owners can insert certifications"
ON public.certifications
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Owners can update certifications"
ON public.certifications
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Owners can delete certifications"
ON public.certifications
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'owner'));

-- Documentation
DROP POLICY IF EXISTS "Authenticated users can insert documentation" ON public.documentation;
DROP POLICY IF EXISTS "Users can update their own documentation" ON public.documentation;
DROP POLICY IF EXISTS "Users can delete their own documentation" ON public.documentation;

CREATE POLICY "Owners can insert documentation"
ON public.documentation
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Owners can update documentation"
ON public.documentation
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Owners can delete documentation"
ON public.documentation
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'owner'));

-- Update profile to remove minor
UPDATE public.profiles 
SET minor = NULL 
WHERE id = 'c02d9307-1bab-466b-b7ab-bfd650efb214';