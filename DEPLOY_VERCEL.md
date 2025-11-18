# Deploy CutTheCrap to Vercel

## Quick Deploy (2 Minutes)

### Step 1: Push Your Code (if not done yet)
```bash
git push origin claude/open-tasks-01PGkUpVA6pAEWE7UwFhmvG8
```

### Step 2: Deploy to Vercel

1. Go to **https://vercel.com/new**
2. Click **"Import Git Repository"**
3. Select your `CutTheCrap` repo
4. Configure:
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** `./` (default)
   - **Build Command:** `npm run build` (default)
   - **Output Directory:** `.next` (default)

### Step 3: Add Environment Variables

In Vercel dashboard, add these:

```
CONGRESS_API_KEY=your_api_key_here
FEDDOC_MCP_ENABLED=false
NODE_ENV=production
```

**Important:** Set `FEDDOC_MCP_ENABLED=false` for now (more below)

### Step 4: Deploy!

Click **"Deploy"** - Vercel will build and deploy in ~2 minutes.

---

## ⚠️ The Python MCP Problem

**Issue:** Vercel can't run the Python FedDocMCP server (it's a Node.js/Edge platform).

**Solutions:**

### Option A: Direct API Integration (Recommended)

Replace MCP calls with direct Congress.gov API calls in your Next.js API routes.

**Pros:**
- ✅ No external dependencies
- ✅ Faster (no MCP overhead)
- ✅ Simpler architecture
- ✅ All on Vercel

**Implementation:**
- Refactor `src/services/mcp-client.ts` to call Congress API directly
- Remove Python dependency
- Keep all the caching/graph building logic

**Time:** ~1 hour of work

### Option B: Host FedDocMCP Separately

Deploy Python server to Railway/Render, connect via HTTP.

**Pros:**
- ✅ Keep existing MCP architecture
- ✅ Can use MCP for other things later

**Cons:**
- ❌ Two deployments to manage
- ❌ Extra latency (network hop)
- ❌ More complex

**Hosting options:**
- **Railway:** Free $5/month credit, easy Python deployment
- **Render:** Free tier for web services
- **Fly.io:** Free tier available

### Option C: Hybrid Approach

For now, disable MCP features and add them later:

1. Deploy to Vercel with `FEDDOC_MCP_ENABLED=false`
2. Show a "Coming Soon" message for bill analysis
3. Add MCP integration later

---

## Recommended Path

### Phase 1: Deploy Now (5 minutes)
1. Set `FEDDOC_MCP_ENABLED=false` in Vercel
2. Deploy to see the UI live
3. Homepage and structure work perfectly

### Phase 2: Add Direct API Integration (This Weekend)
1. Create `src/lib/congress-api.ts` that calls Congress.gov directly
2. Replace MCP client with direct calls
3. Redeploy - everything works!

### Phase 3: Optimize (Later)
1. Add Vercel Edge caching
2. Optimize for serverless
3. Monitor performance

---

## Environment Variables for Vercel

```bash
# Required
CONGRESS_API_KEY=your_congress_api_key

# Development/Local only (not needed on Vercel)
# FEDDOC_MCP_PATH=./packages/feddoc-mcp/src/server.py
# FEDDOC_MCP_ENABLED=true

# Production
NODE_ENV=production

# Optional: Redis (if you want production caching)
# REDIS_URL=redis://your-redis-url
```

---

## Testing Your Deployment

After Vercel deploys:

1. Visit your `your-app.vercel.app` URL
2. Homepage should load perfectly
3. Bill search won't work yet (need API integration)
4. UI/UX is fully visible

---

## Next Steps After Deployment

**Weekend Task:** Replace MCP with Direct API Calls

Create `src/lib/congress-api.ts`:

```typescript
export async function fetchBillFromCongress(
  congress: number,
  billType: string,
  billNumber: number
) {
  const apiKey = process.env.CONGRESS_API_KEY;
  const url = `https://api.congress.gov/v3/bill/${congress}/${billType}/${billNumber}`;

  const response = await fetch(`${url}?api_key=${apiKey}&format=json`);
  const data = await response.json();

  return data.bill;
}
```

Then update `src/services/mcp-client.ts` to use this instead of MCP.

**Time estimate:** 1-2 hours max

---

## Why This Approach Works

1. **Get live NOW** - See your app on the internet today
2. **Simple architecture** - One deployment, no Python complexity
3. **Better performance** - Direct API calls are faster than MCP
4. **Easier to maintain** - Less moving parts
5. **Vercel-optimized** - Uses platform strengths

---

## Questions?

- **"Will I lose the MCP integration?"** - Not lost, just replaced with direct calls (same data, simpler)
- **"Can I still use MCP later?"** - Yes! Keep it for local dev if you want
- **"How much will Vercel cost?"** - Free tier handles thousands of requests
- **"What about caching?"** - All your cache logic still works, can add Redis later

**Ready to deploy?** Push your code and hit that Vercel deploy button! 🚀
