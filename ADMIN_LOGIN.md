# Digital Heroes — credentials & roles (PRD)

## Roles (PRD §03)

| Role | Signup | After login |
|------|--------|-------------|
| **Public visitor** | — | `/`, `/charities` |
| **Registered subscriber** | `/auth/signup` | `/subscribe` → `/dashboard` |
| **Administrator** | `/auth/admin-signup` | `/admin` |

## Create your own admin

1. Open http://localhost:3000/auth/admin-signup  
2. Enter name, email, password  
3. Submit → you land on **Admin dashboard**

No invite code required.

## Seeded admin (optional backup)

- Email: `admin@digitalheroes.co.in`
- Password: `Admin@12345`

## User flow

1. `/auth/signup` → subscribe → charity → dashboard  
2. Scores, draws, winnings in user panel  
3. Admins can also open **User panel** from admin header  

## Security note

`is_admin` is only set via `/auth/admin-signup`.  
Normal `/auth/signup` cannot self-promote to admin.
