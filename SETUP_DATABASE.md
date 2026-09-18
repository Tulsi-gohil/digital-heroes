# How to set up the Digital Heroes database

Your app talks to Supabase, but the **tables don’t exist yet**. You only need to do this once.

## Steps

1. Open the SQL Editor for your project:  
   https://supabase.com/dashboard/project/mizcrcsolurhjpcohqjm/sql/new

2. Open this file in your project:  
   `digital-heroes/supabase/APPLY_ME.sql`

3. Copy **all** of the file contents (`Ctrl+A` then `Ctrl+C`).

4. Paste into the Supabase SQL Editor (`Ctrl+V`).

5. Click **Run** (bottom-right).

6. Wait until you see **Success**.

7. Confirm tables exist:  
   Supabase → **Table Editor** → you should see `profiles`, `subscriptions`, `charities`, etc.

8. Refresh your app (`http://localhost:3000`) and sign in again.

## After setup

- New signups create a `profiles` row automatically.
- Dashboard / subscribe / charities should stop showing the “tables may not be set up” warning.

## If Run fails

- Make sure you are in the **same project** as your `.env.local` (`mizcrcsolurhjpcohqjm`).
- Paste the **entire** `APPLY_ME.sql` file, not just part of it.
- Tell me the exact red error message from Supabase if it fails.
