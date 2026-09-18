# Auth emails not arriving?

Supabase’s **built-in email is for demos only**:
- About **2 emails per hour**
- Often delayed or sent to spam
- Not reliable for real users

## Fastest fix for local testing (recommended now)

Disable email confirmation so signup works immediately:

1. Open: https://supabase.com/dashboard/project/mizcrcsolurhjpcohqjm/auth/providers
2. Click **Email**
3. Turn **OFF** “Confirm email”
4. Save
5. Sign up again → you go straight in (no email needed)

Also add redirect URLs:
https://supabase.com/dashboard/project/mizcrcsolurhjpcohqjm/auth/url-configuration

- Site URL: `http://localhost:3000`
- Redirect URLs: `http://localhost:3000/**` and `http://localhost:3000/auth/callback`

## Production: use custom SMTP

1. Create a free SMTP account (Resend, Brevo, or SendGrid)
2. Open: https://supabase.com/dashboard/project/mizcrcsolurhjpcohqjm/auth/smtp
3. Enable Custom SMTP and fill host / port `587` / user / password / sender
4. Turn **Confirm email** back ON if you want verification

## Debug

- Auth logs: https://supabase.com/dashboard/project/mizcrcsolurhjpcohqjm/logs/auth-logs
- Check spam folder
- Use **Resend confirmation** on `/auth/verify`
