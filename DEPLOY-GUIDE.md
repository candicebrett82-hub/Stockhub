# StockHub Deployment Guide

## What You'll Set Up
- **Supabase** — free database that stores all your stock data  
- **GitHub** — free code storage (needed for Vercel)  
- **Vercel** — free web hosting that gives you a live URL  

Total cost: **£0/month** on free tiers  
Time needed: **30–45 minutes**  

---

## STEP 1: Create a Supabase Account & Project

1. Go to **https://supabase.com** and click **Start your project**
2. Sign up with your email (or GitHub if you've created that first)
3. Click **New Project**
4. Fill in:
   - **Name:** `stockhub`
   - **Database Password:** choose something strong and **save it somewhere safe**
   - **Region:** pick the one closest to you (e.g. `London (eu-west-2)`)
5. Click **Create new project** — wait 1–2 minutes for it to set up

### Set up the database table

6. In your Supabase dashboard, click **SQL Editor** in the left sidebar
7. Click **New Query**
8. Open the file `supabase/setup.sql` from this project folder
9. Copy ALL the contents and paste into the SQL editor
10. Click **Run** (or press Ctrl+Enter)
11. You should see "Success. No rows returned" — that's correct

### Get your API credentials

12. Click **Settings** (gear icon) in the left sidebar
13. Click **API** under Configuration
14. You'll see two values you need — **copy them somewhere safe**:
    - **Project URL** — looks like `https://abcdefgh.supabase.co`
    - **anon public key** — a long string starting with `eyJ...`

---

## STEP 2: Create a GitHub Account

1. Go to **https://github.com** and click **Sign up**
2. Choose a username, enter your email, create a password
3. Verify your email
4. You don't need to do anything else on GitHub yet — Vercel will handle the rest

---

## STEP 3: Upload the Code to GitHub

1. On GitHub, click the **+** icon in the top right and choose **New repository**
2. Fill in:
   - **Repository name:** `stockhub`
   - **Description:** `Warehouse Stock Register`
   - Leave it as **Public** (or Private if you prefer)
   - **DO NOT** tick "Add a README file"
3. Click **Create repository**
4. You'll see a page with instructions — you need the URL that looks like:
   `https://github.com/YOUR-USERNAME/stockhub.git`

### Upload the files

The easiest way is to use **GitHub's web upload**:

5. On your new empty repository page, click **"uploading an existing file"** link
6. Drag and drop ALL the files and folders from this `stockhub-deploy` folder into the upload area
   - Make sure you include: `src/` folder, `supabase/` folder, `package.json`, `next.config.js`, `jsconfig.json`, `.gitignore`
   - **DO NOT** upload `.env.local` (it contains your secrets)
7. At the bottom, click **Commit changes**

**Alternative: If you have Git installed** (more reliable for folder structure):
```
cd stockhub-deploy
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/stockhub.git
git push -u origin main
```

---

## STEP 4: Deploy to Vercel

1. Go to **https://vercel.com** and click **Sign Up**
2. Choose **Continue with GitHub** and authorise Vercel
3. Once logged in, click **Add New Project**
4. You should see your `stockhub` repository — click **Import**
5. On the configuration page:
   - **Framework Preset:** should auto-detect as Next.js
   - **Root Directory:** leave as default
   - Expand **Environment Variables** and add these two:

   | Name | Value |
   |------|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL from Step 1 |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key from Step 1 |

6. Click **Deploy**
7. Wait 1–2 minutes — Vercel will build and deploy your app
8. When it's done, you'll see a **congratulations page** with your live URL
   - It'll be something like `https://stockhub-xxxxx.vercel.app`
   - **This is your live StockHub!** Bookmark it.

---

## STEP 5: Test It

1. Open your StockHub URL in a browser
2. You should see the dashboard with your Aztek product data
3. Try:
   - Click **Products** — your 48 products should be listed
   - Click a product to see its detail view
   - Go to **Goods In** and create a test receipt
   - Go to **Serials** and add a test serial number
   - Check the **Stock Value** card on the dashboard — click it for the breakdown
4. Open the same URL on another device (phone, another PC) — you should see the same data because it's all stored in Supabase

---

## STEP 6: Share with Your Team

Your StockHub is now live at the Vercel URL. Share it with anyone who needs access — it works in any web browser, on any device.

For the proof of concept, anyone with the URL can access it. When you're ready for production, we can add:
- User login (Supabase Auth — built in, free)
- Role-based access
- The QuoteWerks bridge app

---

## Troubleshooting

**"Application error" on Vercel**  
→ Check that both environment variables are set correctly in Vercel (Settings > Environment Variables). Redeploy after fixing.

**Data not saving / loading**  
→ Check that you ran the `setup.sql` in Supabase. Go to Supabase > Table Editor and verify the `kv_store` table exists.

**Blank page**  
→ Open browser developer tools (F12) and check the Console tab for errors. Usually a missing environment variable.

**Need to update the app?**  
→ Push changes to GitHub. Vercel auto-deploys on every push — your live site updates in ~1 minute.

---

## What's Next

Once the client has seen StockHub working:

1. **Add authentication** — user logins for the team
2. **Build the QW bridge app** — Windows service that reads QuoteWerks and pushes to StockHub automatically
3. **Restructure database** — move from key-value to proper tables for better performance
4. **Custom domain** — point your own domain (e.g. stock.aztek.co.uk) at Vercel

All of these are straightforward additions to what you've already deployed.


