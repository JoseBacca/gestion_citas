-- ============================================================
-- SETUP COMPLETO - gestion_citas
-- Ejecutar TODO en el SQL Editor de Supabase
-- Proyecto: lyinvtozaemvoudrkwnf
-- ============================================================

-- ============================================================
-- PASO 1: Trigger handle_new_user (TEXT role_id)
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, document_number, email, role_id)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(new.raw_user_meta_data ->> 'document_number', ''),
    new.email,
    COALESCE(new.raw_user_meta_data ->> 'role_id', 'APRENDIZ')
  );
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- PASO 2: Limpiar y recrear RLS simplificado
-- ============================================================

-- Limpiar politicas viejas de profiles
DO $$ BEGIN
  DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
  DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
  DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;
  DROP POLICY IF EXISTS "profiles_select_simple" ON public.profiles;
  DROP POLICY IF EXISTS "profiles_update_simple" ON public.profiles;
  DROP POLICY IF EXISTS "profiles_insert_simple" ON public.profiles;
  DROP POLICY IF EXISTS "profiles_read" ON public.profiles;
  DROP POLICY IF EXISTS "profiles_write" ON public.profiles;
  DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Limpiar politicas viejas de appointments
DO $$ BEGIN
  DROP POLICY IF EXISTS "appointments_select" ON public.appointments;
  DROP POLICY IF EXISTS "appointments_insert" ON public.appointments;
  DROP POLICY IF EXISTS "appointments_update" ON public.appointments;
  DROP POLICY IF EXISTS "appointments_select_own" ON public.appointments;
  DROP POLICY IF EXISTS "appointments_insert_own" ON public.appointments;
  DROP POLICY IF EXISTS "appointments_update_own" ON public.appointments;
  DROP POLICY IF EXISTS "appointments_select_admin" ON public.appointments;
  DROP POLICY IF EXISTS "appointments_update_admin" ON public.appointments;
  DROP POLICY IF EXISTS "appointments_select_simple" ON public.appointments;
  DROP POLICY IF EXISTS "appointments_insert_simple" ON public.appointments;
  DROP POLICY IF EXISTS "appointments_update_simple" ON public.appointments;
  DROP POLICY IF EXISTS "appointments_read" ON public.appointments;
  DROP POLICY IF EXISTS "appointments_insert_v2" ON public.appointments;
  DROP POLICY IF EXISTS "appointments_update_v2" ON public.appointments;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "roles_select" ON public.roles;
  DROP POLICY IF EXISTS "roles_read" ON public.roles;
  DROP POLICY IF EXISTS "deps_select" ON public.dependencies;
  DROP POLICY IF EXISTS "deps_read" ON public.dependencies;
  DROP POLICY IF EXISTS "dependencies_read" ON public.dependencies;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "audit_logs_read" ON public.audit_logs;
  DROP POLICY IF EXISTS "system_config_read" ON public.system_config;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ============================================================
-- PASO 3: Crear politicas RLS nuevas (sin JOIN a roles)
-- ============================================================

-- PROFILES: cualquier autenticado puede leer todos los perfiles
CREATE POLICY "profiles_read" ON public.profiles
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- PROFILES: solo tu propio perfil puedes actualizar
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- PROFILES: solo tu propio perfil puedes insertar (fallback)
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- APPOINTMENTS: cualquier autenticado puede leer
CREATE POLICY "appointments_read" ON public.appointments
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- APPOINTMENTS: autenticados pueden crear
CREATE POLICY "appointments_insert" ON public.appointments
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- APPOINTMENTS: autenticados pueden actualizar
CREATE POLICY "appointments_update" ON public.appointments
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- ROLES: lectura publica
CREATE POLICY "roles_read" ON public.roles
  FOR SELECT USING (true);

-- DEPENDENCIES: lectura publica
CREATE POLICY "dependencies_read" ON public.dependencies
  FOR SELECT USING (true);

-- AUDIT_LOGS: lectura autenticada
DO $$ BEGIN
  CREATE POLICY "audit_logs_read" ON public.audit_logs
    FOR SELECT USING (auth.uid() IS NOT NULL);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- SYSTEM_CONFIG: lectura autenticada
DO $$ BEGIN
  CREATE POLICY "system_config_read" ON public.system_config
    FOR SELECT USING (auth.uid() IS NOT NULL);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ============================================================
-- PASO 4: Confirmar todos los emails pendientes
-- ============================================================
UPDATE auth.users SET email_confirmed_at = now()
WHERE email_confirmed_at IS NULL;

-- ============================================================
-- PASO 5: RPC Functions para Dashboard
-- ============================================================

DROP FUNCTION IF EXISTS public.get_dashboard_kpis(date, date);
CREATE OR REPLACE FUNCTION public.get_dashboard_kpis(start_date date, end_date date)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_appointments', count(*),
    'pending_appointments', count(*) filter (where status = 'pending'),
    'completed_appointments', count(*) filter (where status = 'completed'),
    'total_users', (select count(*) from public.profiles)
  ) INTO result
  FROM public.appointments
  WHERE scheduled_date >= start_date AND scheduled_date <= end_date;
  RETURN result;
END;
$$;

DROP FUNCTION IF EXISTS public.get_monthly_appointments(int);
CREATE OR REPLACE FUNCTION public.get_monthly_appointments(year_param int)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_agg(jsonb_build_object(
    'month', to_char(month_series, 'YYYY-MM'),
    'total', coalesce(counts.c, 0)
  ) ORDER BY month_series) INTO result
  FROM generate_series(
    make_date(year_param, 1, 1),
    make_date(year_param, 12, 1),
    interval '1 month'
  ) month_series
  LEFT JOIN (
    SELECT date_trunc('month', scheduled_date)::date as m, count(*) as c
    FROM public.appointments
    WHERE date_trunc('month', scheduled_date)::date BETWEEN make_date(year_param, 1, 1) AND make_date(year_param, 12, 1)
    GROUP BY m
  ) counts ON counts.m = month_series;
  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_dashboard_kpis(date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_monthly_appointments(int) TO authenticated;

-- ============================================================
-- PASO 6: Crear usuarios de prueba
-- ============================================================

-- Aprendiz
DO $$
DECLARE
  uid uuid;
BEGIN
  SELECT id INTO uid FROM auth.users WHERE email = 'aprendiz@gmail.com';
  IF uid IS NULL THEN
    uid := gen_random_uuid();
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
    VALUES (
      uid,
      'aprendiz@gmail.com',
      crypt('Aprendiz123!', gen_salt('bf')),
      now(),
      jsonb_build_object('full_name', 'Maria Rodriguez', 'document_number', '1098765432', 'role_id', 'APRENDIZ'),
      now(), now()
    );
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
    VALUES (gen_random_uuid(), uid, jsonb_build_object('sub', uid, 'email', 'aprendiz@gmail.com'), 'email', 'aprendiz@gmail.com', now(), now());
    INSERT INTO auth.sessions (user_id, created_at, updated_at, factor_id, aal, expires_at, not_after)
    VALUES (uid, now(), now(), '', 'aal1', now() + interval '7 days', extract(epoch from now() + interval '7 days'));
  END IF;
  -- Crear profile si no existe
  INSERT INTO public.profiles (id, full_name, document_number, email, role_id, dependency_id)
  VALUES (uid, 'Maria Rodriguez', '1098765432', 'aprendiz@gmail.com', 'APRENDIZ', 1)
  ON CONFLICT (id) DO UPDATE SET role_id = 'APRENDIZ', dependency_id = 1;
END $$;

-- Psicologia
DO $$
DECLARE
  uid uuid;
BEGIN
  SELECT id INTO uid FROM auth.users WHERE email = 'psicologia@gmail.com';
  IF uid IS NULL THEN
    uid := gen_random_uuid();
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
    VALUES (
      uid,
      'psicologia@gmail.com',
      crypt('Psicologia123!', gen_salt('bf')),
      now(),
      jsonb_build_object('full_name', 'Dr. Carlos Mendez', 'document_number', '80123456', 'role_id', 'PSICOLOGIA'),
      now(), now()
    );
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
    VALUES (gen_random_uuid(), uid, jsonb_build_object('sub', uid, 'email', 'psicologia@gmail.com'), 'email', 'psicologia@gmail.com', now(), now());
  END IF;
  INSERT INTO public.profiles (id, full_name, document_number, email, role_id, dependency_id)
  VALUES (uid, 'Dr. Carlos Mendez', '80123456', 'psicologia@gmail.com', 'PSICOLOGIA', 1)
  ON CONFLICT (id) DO UPDATE SET role_id = 'PSICOLOGIA', dependency_id = 1;
END $$;

-- Enfermeria
DO $$
DECLARE
  uid uuid;
BEGIN
  SELECT id INTO uid FROM auth.users WHERE email = 'enfermeria@gmail.com';
  IF uid IS NULL THEN
    uid := gen_random_uuid();
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
    VALUES (
      uid,
      'enfermeria@gmail.com',
      crypt('Enfermeria123!', gen_salt('bf')),
      now(),
      jsonb_build_object('full_name', 'Dra. Ana Martinez', 'document_number', '52345678', 'role_id', 'ENFERMERIA'),
      now(), now()
    );
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
    VALUES (gen_random_uuid(), uid, jsonb_build_object('sub', uid, 'email', 'enfermeria@gmail.com'), 'email', 'enfermeria@gmail.com', now(), now());
  END IF;
  INSERT INTO public.profiles (id, full_name, document_number, email, role_id, dependency_id)
  VALUES (uid, 'Dra. Ana Martinez', '52345678', 'enfermeria@gmail.com', 'ENFERMERIA', 2)
  ON CONFLICT (id) DO UPDATE SET role_id = 'ENFERMERIA', dependency_id = 2;
END $$;

-- Coordinacion
DO $$
DECLARE
  uid uuid;
BEGIN
  SELECT id INTO uid FROM auth.users WHERE email = 'coordinacion@gmail.com';
  IF uid IS NULL THEN
    uid := gen_random_uuid();
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
    VALUES (
      uid,
      'coordinacion@gmail.com',
      crypt('Coordinacion123!', gen_salt('bf')),
      now(),
      jsonb_build_object('full_name', 'Luisa Fernandez', 'document_number', '52123456', 'role_id', 'COORDINACION'),
      now(), now()
    );
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
    VALUES (gen_random_uuid(), uid, jsonb_build_object('sub', uid, 'email', 'coordinacion@gmail.com'), 'email', 'coordinacion@gmail.com', now(), now());
  END IF;
  INSERT INTO public.profiles (id, full_name, document_number, email, role_id, dependency_id)
  VALUES (uid, 'Luisa Fernandez', '52123456', 'coordinacion@gmail.com', 'COORDINACION', 16)
  ON CONFLICT (id) DO UPDATE SET role_id = 'COORDINACION', dependency_id = 16;
END $$;

-- ============================================================
-- PASO 7: Crear cita de prueba
-- ============================================================
DO $$
DECLARE
  aprendiz_uid uuid;
  psicologia_uid uuid;
BEGIN
  SELECT id INTO aprendiz_uid FROM auth.users WHERE email = 'aprendiz@gmail.com';
  SELECT id INTO psicologia_uid FROM auth.users WHERE email = 'psicologia@gmail.com';
  
  IF aprendiz_uid IS NOT NULL AND psicologia_uid IS NOT NULL THEN
    INSERT INTO public.appointments (user_id, professional_id, dependency_id, scheduled_date, scheduled_time, status, reason, notes)
    VALUES (
      aprendiz_uid,
      psicologia_uid,
      1,
      CURRENT_DATE + INTERVAL '3 days',
      '10:00:00',
      'pending',
      'Sesion de orientacion vocacional',
      'Primera sesion de bienestar'
    )
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- ============================================================
-- PASO 8: Verificacion final
-- ============================================================
SELECT 'USERS' as section, email, raw_user_meta_data ->> 'full_name' as name, raw_user_meta_data ->> 'role_id' as role
FROM auth.users WHERE email != 'admin@gmail.com'
UNION ALL
SELECT 'PROFILES', p.email, p.full_name, p.role_id
FROM public.profiles p WHERE p.email != 'admin@gmail.com'
UNION ALL
SELECT 'APPOINTMENTS', a.reason, a.status::text, a.scheduled_date::text
FROM public.appointments a LIMIT 5;
