-- ============================================================
-- Migracion: Agregar campo ficha a profiles
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. Agregar columna ficha
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS ficha text;

-- 2. Actualizar trigger para guardar ficha
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, document_number, email, role_id, ficha)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(new.raw_user_meta_data ->> 'document_number', ''),
    new.email,
    COALESCE(new.raw_user_meta_data ->> 'role_id', 'APRENDIZ'),
    new.raw_user_meta_data ->> 'ficha'
  );
  RETURN new;
END;
$$;

-- 3. Migrar fichas existentes de user_metadata a profiles
UPDATE public.profiles p
SET ficha = au.raw_user_meta_data ->> 'ficha'
FROM auth.users au
WHERE p.id = au.id
AND au.raw_user_meta_data ->> 'ficha' IS NOT NULL
AND p.ficha IS NULL;
