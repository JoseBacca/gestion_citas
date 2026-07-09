-- ============================================================
-- FIX: Eliminar políticas RLS problemáticas
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. Eliminar todas las políticas existentes
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "appointments_select" ON public.appointments;
DROP POLICY IFACES "appointments_insert" ON public.appointments;
DROP POLICY IF EXISTS "appointments_update" ON public.appointments;

-- 2. Deshabilitar RLS temporalmente (para pruebas)
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.dependencies DISABLE ROW LEVEL SECURITY;

-- 3. Verificar que las tablas existen
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
