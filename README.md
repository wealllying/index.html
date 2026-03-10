# PlataYa — El Abrazo

> Send money from the US to the Dominican Republic in minutes. 3% fee, real exchange rates, powered by USDC.

## Stack
- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS** (brand colors built in)
- **Supabase** (auth + database + RLS)
- **MoonPay** (USDC payment rail — add keys when ready)

---

## Setup (5 minutes)

### 1. Install dependencies
```bash
npm install
```

### 2. Create Supabase project
1. Go to [supabase.com](https://supabase.com) → New project
2. Copy your **Project URL** and **anon key** from Settings → API

### 3. Run the database schema
1. In Supabase dashboard → **SQL Editor**
2. Run in order: `001_initial_schema.sql`, then `002_limits_and_compliance.sql`

### 4. Set environment variables
```bash
cp .env.local.example .env.local
```
Fill in your Supabase URL and anon key.

### 5. Run the app
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

---

## What's Built

| Feature | Status |
|---|---|
| Email signup / login | ✅ |
| Protected routes + middleware | ✅ |
| 3-step onboarding (personal, address, KYC) | ✅ |
| Dashboard home | ✅ |
| USD → DOP calculator | ✅ |
| Recipient management (add/delete) | ✅ |
| Transaction creation + history | ✅ |
| Transaction limits (per tx, daily, monthly) | ✅ |
| Source of funds + purpose of transfer | ✅ |
| KYC gating + admin review | ✅ |
| Demo mode banner | ✅ Set `NEXT_PUBLIC_APP_MODE=demo` |
| Supabase schema + RLS | ✅ |
| MoonPay integration | 🔜 Add API key |
| Live exchange rates | ✅ Add `EXCHANGE_RATE_API_KEY` for live rate |
| Push notifications | 🔜 |

---

## Admin (KYC review)
1. In Supabase dashboard → Settings → API, copy your **service_role** key (keep it secret).
2. Add to `.env.local`: `ADMIN_EMAIL=your@email.com` and `SUPABASE_SERVICE_ROLE_KEY=your-service-role-key`
3. Log in with that email and go to [http://localhost:3000/admin](http://localhost:3000/admin) → KYC review to approve or reject submissions.

## Adding MoonPay (when ready)
1. Get API keys at [dashboard.moonpay.com](https://dashboard.moonpay.com)
2. Add to `.env.local`:
```
NEXT_PUBLIC_MOONPAY_API_KEY=pk_live_...
MOONPAY_SECRET_KEY=sk_live_...
```
3. In `app/dashboard/send/page.tsx`, replace the confirm redirect with the MoonPay widget URL

---

## Project Structure
```
plataya/
├── app/
│   ├── auth/login/          # Login page
│   ├── auth/signup/         # Signup page  
│   ├── auth/callback/       # Supabase OAuth callback
│   ├── onboarding/          # 3-step onboarding
│   ├── admin/               # Admin (KYC review) — requires ADMIN_EMAIL + service role
│   └── dashboard/
│       ├── page.tsx         # Dashboard home
│       ├── send/            # Send money flow
│       ├── recipients/      # Manage recipients
│       └── history/         # Transaction history
├── components/
│   ├── ui/                  # Shared UI (Logo, Nav, etc.)
│   └── onboarding/          # Step components
├── lib/
│   ├── supabase/            # Client + server clients
│   └── utils.ts             # Fee calc, formatting
├── types/database.ts        # TypeScript DB types
├── middleware.ts             # Route protection
└── supabase/migrations/     # SQL schema
```
