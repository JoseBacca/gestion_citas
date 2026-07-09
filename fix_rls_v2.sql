-- ============================================================
-- FIX COMPLETO: Políticas RLS simplificadas
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- PASO 1: Eliminar políticas existentes
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "appointments_select" ON public.appointments;
DROP POLICY IF EXISTS "appointments_insert" ON public.appointments;
DROP POLICY IF EXISTS "appointments_update" ON public.appointments;

-- PASO 2: Deshabilitar RLS (para debugging)
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.dependencies DISABLE ROW LEVEL SECURITY;

-- PASO 3: Crear políticas RLS simples (sin subconsultas complejas)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dependencies ENABLE ROW LEVEL SECURITY;

-- Política simple: cada usuario puede ver su propio perfil
CREATE POLICY "profiles_select_simple" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Política simple: cada usuario puede actualizar su propio perfil
CREATE POLICY "profiles_update_simple" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Política simple: cada usuario puede ver sus propias citas
CREATE POLICY "appointments_select_simple" ON public.appointments
  FOR SELECT USING (user_id = auth.uid() OR professional_id = auth.uid());

-- Política simple: cada usuario puede insertar sus propias citas
CREATE POLICY "appointments_insert_simple" ON public.appointments
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Política simple: cada usuario puede actualizar sus propias citas
CREATE POLICY "appointments_update_simple" ON public.appointments
  FOR UPDATE USING (user_id = auth.uid() OR professional_id = auth.uid());

-- Verificar políticas creadas
SELECT policyname, tablename 
FROM pg_policies 
WHERE schemaname = 'public';
