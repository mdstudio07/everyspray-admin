-- =====================================
-- DEMO USER SEED DATA
-- =====================================
-- Seeds demo users for testing authentication system

-- Demo Users for Authentication Testing
-- Note: In production, users are created via Supabase auth.users
-- Here we create test users directly in auth.users for local development

-- Insert demo users into auth.users
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES
-- Super Admin Demo User
(
  '11111111-1111-1111-1111-111111111111',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'admin@everyspray.com',
  crypt('admin123', gen_salt('bf')), -- Password: admin123
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Demo Super Admin","username":"demo_admin"}',
  false,
  '',
  '',
  '',
  ''
),
-- Team Member Demo User
(
  '22222222-2222-2222-2222-222222222222',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'team@everyspray.com',
  crypt('team123', gen_salt('bf')), -- Password: team123
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Demo Team Member","username":"demo_team"}',
  false,
  '',
  '',
  '',
  ''
),
-- Contributor Demo User
(
  '33333333-3333-3333-3333-333333333333',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'user@everyspray.com',
  crypt('user123', gen_salt('bf')), -- Password: user123
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Demo Contributor","username":"demo_user"}',
  false,
  '',
  '',
  '',
  ''
)
ON CONFLICT (id) DO NOTHING;

-- Create user profiles in users_profile table
INSERT INTO public.users_profile (
  id,
  username,
  full_name,
  avatar_url,
  country,
  bio,
  is_suspended,
  contribution_count,
  approval_rate,
  trust_level,
  last_login,
  created_at,
  updated_at
) VALUES
-- Super Admin Profile
(
  '11111111-1111-1111-1111-111111111111',
  'demo_admin',
  'Demo Super Admin',
  NULL,
  'US',
  'Demonstration super administrator account for testing',
  false,
  250,
  98.5,
  'expert',
  NOW(),
  NOW(),
  NOW()
),
-- Team Member Profile
(
  '22222222-2222-2222-2222-222222222222',
  'demo_team',
  'Demo Team Member',
  NULL,
  'UK',
  'Demonstration team member account for testing content moderation',
  false,
  150,
  95.2,
  'expert',
  NOW(),
  NOW(),
  NOW()
),
-- Contributor Profile
(
  '33333333-3333-3333-3333-333333333333',
  'demo_user',
  'Demo Contributor',
  NULL,
  'CA',
  'Demonstration contributor account for testing submissions',
  false,
  45,
  87.3,
  'trusted',
  NOW(),
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Assign roles to demo users
INSERT INTO public.user_roles (
  user_id,
  role,
  assigned_at,
  assigned_by
) VALUES
('11111111-1111-1111-1111-111111111111', 'super_admin', NOW(), '11111111-1111-1111-1111-111111111111'),
('22222222-2222-2222-2222-222222222222', 'team_member', NOW(), '11111111-1111-1111-1111-111111111111'),
('33333333-3333-3333-3333-333333333333', 'contributor', NOW(), '11111111-1111-1111-1111-111111111111')
ON CONFLICT (user_id) DO NOTHING;

-- Log the seeding
INSERT INTO public.role_audit_log (
  user_id,
  old_role,
  new_role,
  changed_by,
  reason,
  changed_at
) VALUES
('11111111-1111-1111-1111-111111111111', NULL, 'super_admin', '11111111-1111-1111-1111-111111111111', 'Initial demo user setup', NOW()),
('22222222-2222-2222-2222-222222222222', NULL, 'team_member', '11111111-1111-1111-1111-111111111111', 'Initial demo user setup', NOW()),
('33333333-3333-3333-3333-333333333333', NULL, 'contributor', '11111111-1111-1111-1111-111111111111', 'Initial demo user setup', NOW())
ON CONFLICT DO NOTHING;

-- Verification: Show created users and roles
DO $$
BEGIN
  RAISE NOTICE '=== DEMO USERS SEEDED ===';
  RAISE NOTICE 'Super Admin: admin@everyspray.com / admin123';
  RAISE NOTICE 'Team Member: team@everyspray.com / team123';
  RAISE NOTICE 'Contributor: user@everyspray.com / user123';
  RAISE NOTICE '========================';
END $$;