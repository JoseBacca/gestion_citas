-- ============================================================
-- FIX COMPLETO RLS v3 - Politicas funcionales
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- PASO 1: Eliminar politicas existentes
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "appointments_select" ON public.appointments;
DROP POLICY IF EXISTS "appointments_insert" ON public.appointments;
DROP POLICY IF EXISTS "appointments_update" ON public.appointments;
DROP POLICY IF EXISTS "profiles_select_simple" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_simple" ON public.profiles;
DROP POLICY IF EXISTS "appointments_select_simple" ON public.appointments;
DROP POLICY IF EXISTS "appointments_insert_simple" ON public.appointments;
DROP POLICY IF EXISTS "appointments_update_simple" ON public.appointments;

-- PASO 2: Deshabilitar RLS temporalmente
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.dependencies DISABLE ROW LEVEL SECURITY;

-- PASO 3: Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dependencies ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- POLITICAS PARA PROFILES
-- ============================================================

-- Cualquier usuario autenticado puede ver su propio perfil
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Coordinacion y Admin pueden ver todos los perfiles
CREATE POLICY "profiles_select_admin" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.roles r ON p.role_id = r.id
      WHERE p.id = auth.uid()
      AND r.name IN ('COORDINACION', 'SUPERADMIN')
    )
  );

-- Cada usuario puede actualizar su propio perfil
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- ============================================================
-- POLITICAS PARA APPOINTMENTS
-- ============================================================

-- Usuarios pueden ver sus propias citas (como aprendiz o profesional)
CREATE POLICY "appointments_select_own" ON public.appointments
  FOR SELECT USING (
    user_id = auth.uid() OR professional_id = auth.uid()
  );

-- Coordinacion y Admin pueden ver todas las citas
CREATE POLICY "appointments_select_admin" ON public.appointments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.roles r ON p.role_id = r.id
      WHERE p.id = auth.uid()
      AND r.name IN ('COORDINACION', 'SUPERADMIN')
    )
  );

-- Aprendices pueden crear sus propias citas
CREATE POLICY "appointments_insert_own" ON public.appointments
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Usuarios pueden actualizar sus propias citas (o las que les estan asignadas)
CREATE POLICY "appointments_update_own" ON public.appointments
  FOR UPDATE USING (
    user_id = auth.uid() OR professional_id = auth.uid()
  );

-- Coordinacion y Admin pueden actualizar cualquier cita
CREATE POLICY "appointments_update_admin" ON public.appointments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.roles r ON p.role_id = r.id
      WHERE p.id = auth.uid()
      AND r.name IN ('COORDINACION', 'SUPERADMIN')
    )
  );

-- ============================================================
-- POLITICAS PARA ROLES Y DEPENDENCIES (solo lectura)
-- ============================================================

-- Todos los autenticados pueden leer roles
CREATE POLICY "roles_select" ON public.roles
  FOR SELECT USING (true);

-- Todos los autenticados pueden leer dependencias
CREATE POLICY "dependencies_select" ON public.dependencies
  FOR SELECT USING (true);

-- ============================================================
-- VERIFICAR POLITICAS
-- ============================================================
SELECT policyname, tablename
FROM pg_policies
WHERE schemaname = 'public';
