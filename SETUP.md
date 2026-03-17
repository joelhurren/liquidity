# Liquidity - Supabase + Vercel + Google Auth Setup

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in (or create account)
2. Click **New Project**
3. Choose org, name it `liquidity`, set a database password, pick a region close to you
4. Wait ~2 minutes for the project to provision

## 2. Run Database Migration

1. In Supabase Dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy-paste the contents of `supabase/migrations/001_create_wines.sql`
4. Click **Run** — this creates the `wines` table with Row Level Security

## 3. Enable Google Auth

1. In Supabase Dashboard → **Authentication** → **Providers**
2. Find **Google** and enable it
3. You'll need a Google OAuth Client ID:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a project (or use existing)
   - Go to **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth Client ID**
   - Application type: **Web application**
   - Authorized redirect URIs: add `https://<your-supabase-project>.supabase.co/auth/v1/callback`
   - Copy the **Client ID** and **Client Secret**
4. Paste both into the Supabase Google provider config
5. Save

## 4. Configure Environment Variables

1. From Supabase Dashboard → **Settings** → **API**:
   - Copy **Project URL** (e.g., `https://xyz.supabase.co`)
   - Copy **anon/public** key
2. Create `.env` in the project root:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

3. Test locally: `npm run dev` — you should see the Google login page

## 5. Deploy to Vercel

1. Push your code to GitHub (if not already)
2. Go to [vercel.com](https://vercel.com) and import your GitHub repo
3. Framework preset: **Vite**
4. Add environment variables in Vercel:
   - `VITE_SUPABASE_URL` = your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key
5. Deploy!

## 6. Update Google OAuth Redirect

After deploying to Vercel, update your Google OAuth redirect URIs:
1. Go to Google Cloud Console → Credentials → Your OAuth Client
2. Add your Vercel URL to **Authorized JavaScript origins**: `https://your-app.vercel.app`
3. The redirect URI stays the Supabase one: `https://<your-project>.supabase.co/auth/v1/callback`

Also update Supabase:
1. Supabase Dashboard → **Authentication** → **URL Configuration**
2. Set **Site URL** to your Vercel deployment URL: `https://your-app.vercel.app`
3. Add `http://localhost:5174` to **Redirect URLs** for local dev

## Offline Mode

If no `.env` file is present (or `VITE_SUPABASE_URL` is empty), the app runs in **offline mode** using localStorage — no login required. This is great for development and testing.

## Architecture

- **Auth**: Supabase Auth with Google OAuth
- **Database**: Supabase Postgres with Row Level Security (each user sees only their wines)
- **Frontend**: React + Vite, deployed on Vercel
- **Offline fallback**: localStorage when Supabase is not configured
