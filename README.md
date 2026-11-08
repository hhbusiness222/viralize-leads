# Viralize CRM

Lead tracker for the Facebook-group post method. Phone-first. Looks and works like GHL: Opportunities board, Contacts, Calendar, one team password.

## Put it online (one time, about 5 minutes, no code)

1. Go to **vercel.com** and sign up with your **GitHub** account (hhbusiness222).
2. Click **Add New → Project**. Pick the **viralize-leads** repo. Click **Deploy**. Wait for it to finish (it will say "no database" on the login page, that's expected).
3. In the project, click the **Storage** tab → **Create Database** → **Neon (Postgres)** → Free plan → **Connect to project**. Vercel fills in the database address for you.
4. Click **Settings → Environment Variables**. Add one:
   - Name: `TEAM_PASSWORD`  Value: whatever password you want the boys to use.
5. Click **Deployments** → the three dots on the top one → **Redeploy**.
6. Open the link Vercel gives you (something like `viralize-leads.vercel.app`). Log in. Send that link to the boys with the password.

On the phone: open the link in Safari/Chrome → Share → **Add to Home Screen**. It then opens like an app.

## Every day

- Someone drops their info on the post → **Add** → business, phone, who's texting them → Save.
- Text them. Log what they said in **Activity**. Move the stage with one tap.
- Booked a call → set date, time and who's taking it. It shows up on **Calendar** and the card turns blue.
- After the call → open the lead, pick the **Outcome**, write **Next step**, Save. It auto-moves to Call done.
- Calls that happened with nothing logged show up as a yellow warning on the pipeline and under **Calendar → Needs outcome**.

## Stages

Interested → Texting → Call booked → Call done → Plan sent → Won / Lost / Ghosted

## Changing the team

**Settings** → edit the reps list (one name per line) → Save. Nobody else can log in without the team password.

## Tech (for whoever maintains it)

Next.js 14 (app router, server actions, no client JS to speak of), Postgres via `postgres`, tables auto-created on first request. Env vars: `TEAM_PASSWORD`, `POSTGRES_URL` (set by Vercel Storage), optional `APP_TZ` (default `America/Toronto`).

```
npm install
POSTGRES_URL=postgres://... TEAM_PASSWORD=x npm run dev
```
