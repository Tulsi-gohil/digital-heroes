# Digital Heroes

A subscription-driven web application combining golf performance tracking, charity fundraising, and a monthly draw-based reward engine. Built for the Digital Heroes Level 1 selection process.

## Features

- **User Authentication**: Sign up, login, and session management with Supabase Auth
- **Subscription System**: Monthly and yearly subscription plans with Stripe integration
- **Golf Score Tracking**: 5-score rolling window in Stableford format (1-45)
- **Charity Selection**: Users choose a charity and allocate a portion of their subscription (minimum 10%)
- **Monthly Draws**: Random lottery-style draws with prize pool distribution
- **Winner Verification**: Proof upload system for winners with admin approval workflow
- **User Dashboard**: Overview, scores, charity selection, and winnings management
- **Admin Dashboard**: User management, draw configuration, charity management, and winner verification
- **Modern UI/UX**: Charity-focused design with animations and micro-interactions

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript
- **Styling**: TailwindCSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Payments**: Stripe
- **Deployment**: Vercel

## Prerequisites

- Node.js 18+ installed
- A Supabase project (create at [supabase.com](https://supabase.com))
- A Stripe account (create at [stripe.com](https://stripe.com))
- A Vercel account (create at [vercel.com](https://vercel.com))

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
cd digital-heroes
npm install
```

### 2. Configure Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to the SQL Editor in your Supabase dashboard
3. Run the schema from `supabase/schema.sql` to create all tables and RLS policies
4. Enable email authentication in Authentication > Providers > Email
5. Get your credentials from Project Settings > API:
   - `Project URL`
   - `anon public key`
   - `service_role key`

### 3. Configure Stripe

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Create two products with prices:
   - Monthly plan: $19.99/month
   - Yearly plan: $199.99/year
3. Copy the Price IDs for both plans
4. Get your API keys from Developers > API keys:
   - `Publishable key`
   - `Secret key`
5. Set up a webhook endpoint for `https://your-domain.com/api/stripe-webhook`

### 4. Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
STRIPE_MONTHLY_PRICE_ID=your_monthly_price_id
STRIPE_YEARLY_PRICE_ID=your_yearly_price_id

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Seed the Database

```bash
npx ts-node scripts/seed.ts
```

This will populate the charities table with sample data.

### 6. Create Admin User

1. Go to your Supabase dashboard > Authentication > Users
2. Create a new user with email: `admin@digitalheroes.co.in`
3. Set a secure password
4. Go to SQL Editor and run:
```sql
UPDATE profiles SET is_admin = true WHERE email = 'admin@digitalheroes.co.in';
```

### 7. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

```
digital-heroes/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── api/               # API routes
│   │   │   ├── admin/        # Admin endpoints
│   │   │   ├── charities/    # Charity endpoints
│   │   │   ├── draws/        # Draw endpoints
│   │   │   ├── scores/       # Score endpoints
│   │   │   ├── subscriptions/ # Subscription endpoints
│   │   │   └── winners/      # Winner endpoints
│   │   ├── auth/             # Authentication pages
│   │   ├── admin/            # Admin dashboard
│   │   ├── charities/        # Charity pages
│   │   ├── dashboard/        # User dashboard
│   │   └── subscribe/        # Subscription pages
│   ├── components/           # React components
│   ├── contexts/            # React contexts (Auth)
│   └── lib/                 # Utility libraries
├── supabase/                # Supabase schema
├── scripts/                 # Database seed scripts
└── public/                  # Static assets
```

## Testing Checklist

- [ ] User signup & login
- [ ] Subscription flow (monthly and yearly)
- [ ] Score entry (5-score rolling logic)
- [ ] Draw system logic and simulation
- [ ] Charity selection and contribution calculation
- [ ] Winner verification flow and payout tracking
- [ ] User dashboard (all modules functional)
- [ ] Admin panel (full control and usability)
- [ ] Data accuracy across all modules
- [ ] Responsive design on mobile and desktop
- [ ] Error handling and edge cases

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Create a new Vercel project from your repository
3. Configure environment variables in Vercel dashboard
4. Deploy

**Important**: Use a new Vercel account and new Supabase project as per the assignment requirements.

### Configure Stripe Webhook

After deployment:
1. Go to Stripe Dashboard > Developers > Webhooks
2. Add your production URL: `https://your-domain.com/api/stripe-webhook`
3. Select events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
4. Copy the webhook secret and add to environment variables

## API Endpoints

### Public
- `GET /api/charities` - List all charities
- `GET /api/charities?featured=true` - List featured charities

### Authenticated
- `GET /api/scores?userId=xxx` - Get user scores
- `POST /api/scores` - Create a score
- `PUT /api/scores/:id` - Update a score
- `DELETE /api/scores/:id` - Delete a score
- `GET /api/subscriptions?userId=xxx` - Get user subscription
- `GET /api/user-charities?userId=xxx` - Get user charity selection
- `POST /api/user-charities` - Update charity selection
- `GET /api/winners?userId=xxx` - Get user winnings
- `POST /api/upload-proof` - Upload winner proof

### Admin
- `GET /api/admin/users` - List all users
- `GET /api/admin/draws` - List all draws
- `GET /api/admin/charities` - List all charities
- `POST /api/admin/charities` - Create charity
- `GET /api/admin/winners` - List all winners
- `POST /api/draws` - Create draw
- `POST /api/draws/:id/simulate` - Simulate draw
- `POST /api/draws/:id/publish` - Publish draw results
- `PUT /api/winners` - Update winner status

## License

This project is issued for the Digital Heroes selection process only.

## Support

For questions or issues, please refer to the PRD document or contact the Digital Heroes team.
