-- Migration: Web CRUD Features
-- 1. Add is_deleted to applications table for soft deletes
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;

-- 2. Create RPC function to check if an email is already used securely
CREATE OR REPLACE FUNCTION public.check_email_used(target_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    email_found boolean;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM auth.users WHERE email = target_email
    ) INTO email_found;
    RETURN email_found;
END;
$$;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION public.check_email_used(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_email_used(text) TO anon;

-- 3. Policy for Admins to delete applications
CREATE POLICY "Admins can delete applications" ON public.applications
FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- 4. RPC for Admins to hard delete a user from auth.users
CREATE OR REPLACE FUNCTION public.delete_user(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin') THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;
    DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_user(uuid) TO authenticated;
