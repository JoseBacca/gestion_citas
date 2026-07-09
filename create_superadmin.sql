-- ============================================================
-- CREAR USUARIO SUPERADMIN
-- Reemplaza los valores entre comillas con tus datos
-- ============================================================

-- Paso 1: Crear usuario en auth.users
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@sena.edu.co',                          -- ← CAMBIA por tu correo
  crypt('Admin123!', gen_salt('bf')),             -- ← CAMBIA por tu contraseña
  now(),                                          -- Email confirmado automáticamente
  '{"full_name": "Super Administrador", "document_number": "12345678"}'::jsonb,
  now(),
  now()
);

-- Paso 2: Crear perfil con rol SUPERADMIN
INSERT INTO public.profiles (id, full_name, document_number, email, role_id)
SELECT
  id,
  'Super Administrador',
  '12345678',                                     -- ← CAMBIA por tu número de documento
  'admin@sena.edu.co',                            -- ← CAMBIA por tu correo (mismo que arriba)
  (SELECT id FROM public.roles WHERE name = 'SUPERADMIN')
FROM auth.users
WHERE email = 'admin@sena.edu.co'                 -- ← CAMBIA por tu correo
ON CONFLICT (id) DO NOTHING;
