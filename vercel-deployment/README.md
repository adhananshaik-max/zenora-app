# 🏋️ Zenora Gym AI — Vercel Deployment Guide

## What's included
- `pages/index.js` — Main app entry point
- `pages/api/ai.js` — Serverless API route (uses Groq Cloud AI)
- `src/App.jsx` — The full gym management app
- `.env.example` — Environment variable template
- `package.json` — Project dependencies

---

## Step 1 — Get your Groq API key

1. Go to **https://www.groq.com** or your Groq Cloud dashboard
2. Sign in or create a free account
3. Create an API key and copy it

**Optional:** if you also have an Ollama key, add it as a fallback.

---

## Step 2 — Set up the project locally (optional)

```bash
# Install dependencies
npm install

# Create .env.local with your key
cat > .env.local <<'EOF'
GROQ_API_KEY=your-groq-api-key-here
GROQ_MODEL=llama-3.1-8b-versatile
# Optional fallback for AI service
OLLAMA_API_KEY=your-ollama-api-key-here
EOF

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
5. Add: `GROQ_API_KEY` = `your-groq-api-key-here`
6. (Optional) add: `OLLAMA_API_KEY` = `your-ollama-api-key-here`
7. Click **Deploy** 🎉
8. Your app is live at `https://your-project.vercel.app`

### Option B — Vercel CLI
```bash
npm install -g vercel
vercel login
vercel --prod
# When prompted for env vars, add GROQ_API_KEY and optional OLLAMA_API_KEY
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
Calls Groq Cloud AI with GROQ_API_KEY (optional Ollama fallback)
        ↓
Returns AI response to the app
```

API key stays on the server — never exposed to the browser. ✅

---

## Troubleshooting

| Problem | Fix |
|---|---|
| "GROQ_API_KEY not set" | Add it in Vercel → Settings → Environment Variables |
| "Groq API error 400" | Check your key in your Groq dashboard |
| "Groq API error 429" | Daily limit hit — wait for reset or use Ollama fallback |
| "Ollama API error" | Add `OLLAMA_API_KEY` or check your Ollama service |
| AI works locally but not on Vercel | Re-deploy after adding env vars |
