-- ============================================
-- Add Admin User Script
-- ============================================
-- Instructions:
-- 1. Generate password hash first: node scripts/generate-password-hash.js 'YourPassword'
-- 2. Replace the placeholders below with your values
-- 3. Run this script: psql -h localhost -U postgres -d zpay -f scripts/add-admin-user.sql
-- ============================================

-- Replace these values:
-- ADMIN_EMAIL: Your admin email address
-- ADMIN_USERNAME: Your admin username (must be unique)
-- ADMIN_PASSWORD_HASH: The bcrypt hash from generate-password-hash.js
-- ADMIN_NAME: Display name for the admin user

INSERT INTO "User" (
  id,
  email,
  username,
  password,
  "isAdmin",
  name,
  "createdAt",
  "updatedAt"
) VALUES (
  gen_random_uuid(),
  'ADMIN_EMAIL',                    -- ⚠️ REPLACE: admin@example.com
  'ADMIN_USERNAME',                 -- ⚠️ REPLACE: admin
  'ADMIN_PASSWORD_HASH',            -- ⚠️ REPLACE: $2a$10$... (from generate-password-hash.js)
  true,                             -- Admin status
  'ADMIN_NAME',                     -- ⚠️ REPLACE: Admin User
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE
SET 
  "isAdmin" = true,
  password = EXCLUDED.password,
  "updatedAt" = NOW();

-- Verify the user was created
SELECT 
  id, 
  email, 
  username, 
  "isAdmin", 
  name, 
  "createdAt"
FROM "User" 
WHERE email = 'ADMIN_EMAIL';  -- ⚠️ REPLACE with same email as above
