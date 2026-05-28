# 🏋️ Zenora Gym AI — Vercel Deployment Guide

## What's included
- `pages/index.js` — Main app entry point
- `pages/api/ai.js` — Serverless API route (uses Google Gemini — FREE)
- `src/App.jsx` — The full gym management app
- `.env.example` — Environment variable template
- `package.json` — Project dependencies

---

## Step 1 — Get your FREE Google Gemini API key (2 minutes)

1. Go to **https://aistudio.google.com**
2. Sign in with your **Google account**
3. Click **"Get API Key"** → **"Create API key"**
4. Copy the key

**Free limits:** 1,500 requests/day · 1 million tokens/day
This is completely free — no credit card needed.

---

## Step 2 — Set up the project locally (optional)

```bash
# Install dependencies
npm install

# Create .env.local with your key
echo "GEMINI_API_KEY=your-key-here" > .env.local

# Run locally
npm run dev
# Open http://localhost:3000
```

---

## Step 3 — Deploy to Vercel (free hosting)

### Option A — GitHub (recommended, easiest)
1. Push this folder to a **GitHub repository**
2. Go to **https://vercel.com** → Sign up free → **"Add New Project"**
3. Import your GitHub repo
4. **Before clicking Deploy** → go to **Environment Variables**
5. Add: `GEMINI_API_KEY` = `your-gemini-key-here`
6. Click **Deploy** 🎉
7. Your app is live at `https://your-project.vercel.app`

### Option B — Vercel CLI
```bash
npm install -g vercel
vercel login
vercel --prod
# When prompted for env vars, add GEMINI_API_KEY
```

---

## How it works

```
User taps AI button in app
        ↓
Frontend sends POST to /api/ai
        ↓
Vercel serverless function
        ↓
Calls Google Gemini API (FREE) with GEMINI_API_KEY
        ↓
Returns AI response to the app
```

API key stays on the server — never exposed to the browser. ✅

---

## Troubleshooting

| Problem | Fix |
|---|---|
| "GEMINI_API_KEY not set" | Add it in Vercel → Settings → Environment Variables |
| "Gemini API error 400" | Check your key at aistudio.google.com |
| "Gemini API error 429" | Daily free limit hit — resets at midnight |
| AI works in Claude preview but not on Vercel | Re-deploy after adding env var |
