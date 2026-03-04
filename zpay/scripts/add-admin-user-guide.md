# Step-by-Step Guide: Add Admin User Using psql

## Prerequisites
- PostgreSQL database is running
- You have access to the database (credentials from `.env` file)
- Node.js installed (for password hashing)

## Step 1: Generate Password Hash

First, generate a bcrypt hash for your admin password:

```bash
# Navigate to project root
cd /path/to/zpay

# Generate password hash (replace 'YourSecurePassword123!' with your desired password)
node scripts/generate-password-hash.js 'YourSecurePassword123!'
```

**Example output:**
```
Hashed password: $2a$10$abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLMNOPQRSTUV
```

**Copy the entire hash** - you'll need it in Step 3.

## Step 2: Connect to PostgreSQL Database

Connect to your PostgreSQL database using psql. Use the connection details from your `.env` file:

```bash
# Format: psql -h <host> -U <username> -d <database>
# Example (from .env.example):
psql -h localhost -U postgres -d zpay

# Or if using the full connection string format:
psql postgresql://postgres:password@localhost:5432/zpay
```

**Note:** Replace `password` with your actual database password from `.env`.

## Step 3: Generate a Unique User ID

You can use PostgreSQL's `gen_random_uuid()` function or generate a CUID manually. For simplicity, we'll use a UUID:

```sql
-- Generate a UUID (you can also use this directly in the INSERT)
SELECT gen_random_uuid();
```

**Copy the UUID** - you'll use it as the user `id`.

## Step 4: Insert Admin User

Run the following SQL command, replacing the placeholders:

```sql
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
  gen_random_uuid(),                    -- or use the UUID from Step 3
  'admin@example.com',                  -- Change to your admin email
  'admin',                               -- Change to your desired username
  '$2a$10$YOUR_HASHED_PASSWORD_HERE',   -- Paste the hash from Step 1
  true,                                  -- Set admin status to true
  'Admin User',                          -- Display name
  NOW(),
  NOW()
);
```

**Example with actual values:**
```sql
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
  'admin@mycompany.com',
  'admin',
  '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLMNOPQRSTUV',
  true,
  'Admin User',
  NOW(),
  NOW()
);
```

## Step 5: Verify the User Was Created

Verify the admin user was created successfully:

```sql
-- Check if user exists and is admin
SELECT id, email, username, "isAdmin", name, "createdAt" 
FROM "User" 
WHERE email = 'admin@example.com';

-- Or list all admin users
SELECT id, email, username, "isAdmin" 
FROM "User" 
WHERE "isAdmin" = true;
```

You should see your newly created admin user with `isAdmin` set to `true`.

## Step 6: Exit psql

```sql
\q
```

## Step 7: Test Login

1. Go to your application's login page (usually `/auth/login`)
2. Use the **Credentials** login method
3. Enter:
   - **Email:** The email you used in Step 4
   - **Password:** The plain text password you hashed in Step 1
4. You should now be logged in as an admin user

## Troubleshooting

### Error: "duplicate key value violates unique constraint"
- The email or username already exists. Use a different email/username or update the existing user:
  ```sql
  UPDATE "User" SET "isAdmin" = true WHERE email = 'existing@email.com';
  ```

### Error: "relation 'User' does not exist"
- Make sure you're connected to the correct database. Check your `DATABASE_URL` in `.env`.

### Can't connect to database
- Verify PostgreSQL is running: `sudo systemctl status postgresql` (Linux) or check your PostgreSQL service
- Verify connection string in `.env` matches your database setup
- Check firewall settings if connecting remotely

### Password hash not working
- Make sure you copied the **entire** hash string (it's long, ~60 characters)
- Ensure you're using bcryptjs with 10 salt rounds (the script handles this)

## Alternative: Make Existing User an Admin

If you already have a user account and want to make it admin:

```sql
UPDATE "User" 
SET "isAdmin" = true, "updatedAt" = NOW()
WHERE email = 'existing-user@example.com';
```

## Security Notes

- **Never commit passwords or password hashes to version control**
- Use a strong password (minimum 12 characters, mix of letters, numbers, symbols)
- Consider using environment variables for sensitive data
- Regularly rotate admin passwords
- Limit admin access to trusted individuals only
