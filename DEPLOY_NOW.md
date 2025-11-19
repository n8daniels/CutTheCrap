# 🚀 Deploy CutTheCrap to Vercel - Tomorrow Morning Guide

**Time Required:** 30 minutes
**Cost:** $0/month (Vercel free tier)

---

## ☕ Morning Checklist (Do This Over Coffee)

### Step 1: Get API Keys (10 minutes)

```bash
# Open Congress.gov API signup
open https://api.congress.gov/sign-up/
```

**Create TWO API keys** (takes 5 min each):

1. **Development Key**
   - Name: `CutTheCrap - Development - 2025-01`
   - Copy key → Save to notes app

2. **Production Key**
   - Name: `CutTheCrap - Production - 2025-01`
   - Copy key → Save to notes app

**✅ You should now have 2 API keys ready**

---

### Step 2: Set Up Local Environment (5 minutes)

```bash
# Navigate to project
cd /home/user/CutTheCrap

# Create .env file
cp .env.example .env

# Edit .env (paste your DEV key)
nano .env
# Or use your preferred editor:
# vim .env
# code .env
```

**Replace this line:**
```bash
CONGRESS_API_KEY=your_DEV_api_key_here
```

**With your actual DEV key:**
```bash
CONGRESS_API_KEY=<paste_your_dev_key_here>
```

**Save and exit** (Ctrl+X, then Y, then Enter in nano)

---

### Step 3: Test Locally (5 minutes)

```bash
# Install dependencies (if not done already)
npm install

# Start dev server
npm run dev
```

**Expected output:**
```
[CONFIG] ✅ Configuration validation passed
[SECURITY] Congress.gov API key validated successfully
✓ Ready in 2.5s
```

**Open browser:** http://localhost:3000

**Try analyzing a bill:** `118/hr/1`

**✅ If it works, proceed to deployment**
**❌ If it fails, tell me the error**

---

### Step 4: Prepare for Deployment (2 minutes)

```bash
# Stop dev server (Ctrl+C)

# Make sure you're on the feature branch
git status

# Merge to main
git checkout main
git merge claude/open-tasks-01PGkUpVA6pAEWE7UwFhmvG8

# Push to GitHub
git push origin main
```

---

### Step 5: Deploy to Vercel (10 minutes)

```bash
# Install Vercel CLI (if not installed)
npm install -g vercel

# Login to Vercel
vercel login
# Follow the prompts to authenticate

# Deploy to production
vercel --prod
```

**When prompted:**
- **Link to existing project?** → `N` (No, create new)
- **Project name?** → `cut-the-crap` (or whatever you want)
- **Directory?** → `.` (press Enter)
- **Override settings?** → `N` (No)

**Wait 2-3 minutes for build...**

---

### Step 6: Set Production API Key (3 minutes)

```bash
# Add your PRODUCTION API key
vercel env add CONGRESS_API_KEY production

# When prompted, paste your PRODUCTION key
# (NOT the dev key!)
```

**Then redeploy to pick up the key:**

```bash
vercel --prod
```

---

### Step 7: Verify Production (2 minutes)

```bash
# Get your live URL
vercel inspect
```

**Open the URL in your browser**

**Try analyzing:** `118/hr/1`

**✅ If it works → YOU'RE LIVE! 🎉**

**Check logs if needed:**
```bash
vercel logs --follow
```

---

## 🎯 Quick Reference: All Commands

```bash
# Full deployment in one go:
cd /home/user/CutTheCrap
cp .env.example .env
nano .env  # Add DEV key
npm install
npm run dev  # Test locally (http://localhost:3000)
# Ctrl+C to stop
git checkout main
git merge claude/open-tasks-01PGkUpVA6pAEWE7UwFhmvG8
git push origin main
vercel login
vercel --prod
vercel env add CONGRESS_API_KEY production  # Paste PROD key
vercel --prod
vercel inspect  # Get live URL
```

---

## 🐛 Troubleshooting

### "npm run dev" fails
```bash
# Check Node version
node --version  # Should be 18+

# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### "CONGRESS_API_KEY format validation failed"
- Make sure you're not using placeholder text
- Key should be 30-40 characters long
- No spaces or newlines

### Vercel deployment times out
```bash
# Check logs
vercel logs

# Try redeploying
vercel --prod --force
```

### API returns 500 errors in production
```bash
# Check environment variable is set
vercel env ls

# Should see: CONGRESS_API_KEY (Production)

# Check logs for specific error
vercel logs --follow
```

---

## ✅ Success Checklist

After deployment, verify:

- [ ] Local dev works (http://localhost:3000)
- [ ] Can analyze bill `118/hr/1` locally
- [ ] Deployed to Vercel successfully
- [ ] Production API key is set
- [ ] Live site loads (https://your-app.vercel.app)
- [ ] Can analyze bill `118/hr/1` in production
- [ ] No errors in Vercel logs

---

## 📝 What You'll Have

**Local:**
- `.env` with DEV API key
- Running on http://localhost:3000

**Production:**
- Live at `https://cut-the-crap.vercel.app` (or similar)
- Using PROD API key
- $0/month hosting
- Auto-deploys on git push to main

---

## 🔐 Security Notes

**Your Setup:**
- ✅ Dev/Prod API keys separated (quota isolation)
- ✅ Rate limiting (10 req/min)
- ✅ Input validation
- ✅ Secret scrubbing in logs
- ✅ All P0/P1 vulnerabilities fixed

**API Keys:**
- Dev key: In local `.env` (gitignored)
- Prod key: In Vercel environment variables
- Both from Congress.gov (free, 5000 req/hour each)

---

## 🎉 You're Done!

**Your app will be live at:**
`https://cut-the-crap.vercel.app` (or your custom URL)

**Cost:** $0/month

**Next steps:**
- Share the URL
- Monitor usage at vercel.com/dashboard
- Add custom domain (optional, ~$10/year)

---

## 📞 If You Get Stuck

**Common issues solved in this order:**

1. **Can't get API key** → Check email for Congress.gov confirmation
2. **Local dev fails** → Check `.env` file has correct key
3. **Vercel deploy fails** → Check `vercel logs`
4. **Production 500 errors** → Verify `vercel env ls` shows API key
5. **Still stuck** → Share the error message

---

**Estimated Time:** 30 minutes total
**Difficulty:** Easy (just follow the steps)

**Good luck tomorrow! 🚀**
