# Analytics & Interactive Documentation Setup Guide

This guide explains how to integrate real-time usage analytics from FedDocMCP into your interactive documentation site.

---

## Overview

Your Figma documentation site needs **real usage data** to display metrics like:
- Cache hit rates
- Average response times
- Tool usage statistics
- API call counts
- Server health status

**Architecture:**
```
FedDocMCP Server → Telemetry Client → Backend Storage → API → Figma Frontend
```

---

## Option 1: Firebase (Recommended for Beginners)

### Pros:
- ✅ Free tier (generous limits)
- ✅ Real-time updates
- ✅ No server management
- ✅ 5-minute setup
- ✅ Official JavaScript SDK

### Setup Steps:

#### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project"
3. Name it "FedDocMCP"
4. Disable Google Analytics (optional)
5. Click "Create Project"

#### 2. Enable Realtime Database

1. In Firebase Console, go to "Realtime Database"
2. Click "Create Database"
3. Choose location (us-central1)
4. Start in **test mode** (we'll secure it later)
5. Click "Enable"

#### 3. Get Configuration

1. Go to Project Settings → General
2. Scroll to "Your apps"
3. Click web icon (</>)
4. Register app: "FedDocMCP-Analytics"
5. Copy the `firebaseConfig` object

#### 4. Add to MCP Server

```bash
# Install Firebase Admin SDK
pip install firebase-admin

# Download service account key
# Firebase Console → Project Settings → Service Accounts → Generate New Private Key
# Save as firebase-credentials.json (DON'T commit to git!)
```

Add to `.env`:
```bash
FIREBASE_CREDENTIALS_PATH=/path/to/firebase-credentials.json
FIREBASE_DATABASE_URL=https://feddocmcp-default-rtdb.firebaseio.com
TELEMETRY_ENABLED=true
```

#### 5. Integrate with Figma Site

Copy the JavaScript code from `docs/analytics-integration.html` and paste into your Figma export.

Replace the `firebaseConfig` with your actual config:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY",
  authDomain: "feddocmcp.firebaseapp.com",
  databaseURL: "https://feddocmcp-default-rtdb.firebaseio.com",
  projectId: "feddocmcp",
  storageBucket: "feddocmcp.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

#### 6. Deploy to GitHub Pages

```bash
# Copy your Figma export to docs/ folder
cp -r /path/to/figma-export/* docs/

# Commit and push
git add docs/
git commit -m "Add interactive analytics dashboard"
git push origin main

# Enable GitHub Pages
# Repo Settings → Pages → Source: main branch, /docs folder
```

Your analytics dashboard will be live at:
```
https://n8daniels.github.io/FedDocMCP/
```

#### 7. Secure Your Database (Important!)

Firebase Rules (`Realtime Database → Rules`):

```json
{
  "rules": {
    "metrics": {
      ".read": true,
      ".write": "auth != null"
    }
  }
}
```

This allows public read, but only authenticated writes (from your server).

---

## Option 2: Supabase (Open Source Alternative)

### Pros:
- ✅ Open source
- ✅ PostgreSQL backend
- ✅ Free tier
- ✅ Real-time subscriptions
- ✅ More control than Firebase

### Setup Steps:

#### 1. Create Supabase Project

1. Go to [Supabase](https://supabase.com/)
2. Sign up / Log in
3. Create New Project
4. Name: "FedDocMCP Analytics"
5. Generate a password
6. Choose region
7. Wait for provisioning (~2 minutes)

#### 2. Create Metrics Table

Go to SQL Editor and run:

```sql
CREATE TABLE metrics (
  id SERIAL PRIMARY KEY,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  cache_hit_rate NUMERIC,
  avg_response_time_ms NUMERIC,
  total_requests INTEGER,
  error_count INTEGER,
  tool_calls JSONB,
  api_calls JSONB
);

-- Enable real-time
ALTER PUBLICATION supabase_realtime ADD TABLE metrics;

-- Create index for efficient queries
CREATE INDEX idx_metrics_timestamp ON metrics(timestamp DESC);
```

#### 3. Get API Keys

1. Go to Project Settings → API
2. Copy:
   - Project URL
   - `anon` public key
   - `service_role` secret key (for server)

#### 4. Python Integration

```bash
pip install supabase
```

Create `src/utils/telemetry_supabase.py`:

```python
from supabase import create_client, Client
import os

class SupabaseTelemetryClient:
    def __init__(self):
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_SERVICE_KEY")
        self.client: Client = create_client(url, key)

    async def send_metrics(self, metrics):
        self.client.table('metrics').insert(metrics).execute()
```

#### 5. Frontend Integration

```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'YOUR_SUPABASE_URL',
  'YOUR_ANON_KEY'
)

// Subscribe to real-time updates
supabase
  .channel('metrics')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'metrics'
  }, (payload) => {
    updateDashboard(payload.new)
  })
  .subscribe()

// Query latest metrics
const { data } = await supabase
  .from('metrics')
  .select('*')
  .order('timestamp', { ascending: false })
  .limit(100)
```

---

## Option 3: GitHub as Database (100% Free, No External Services)

### Pros:
- ✅ Completely free
- ✅ No external services
- ✅ Version controlled metrics
- ✅ No rate limits for reads

### Cons:
- ❌ Not real-time (5-minute updates)
- ❌ GitHub API rate limits for writes
- ❌ More complex setup

### How It Works:

1. MCP server commits JSON files to `telemetry-data` branch
2. GitHub Pages serves JSON files as static assets
3. Frontend fetches and displays metrics

### Setup Steps:

#### 1. Create Telemetry Branch

```bash
git checkout --orphan telemetry-data
git rm -rf .
mkdir metrics
echo "# Telemetry Data" > README.md
git add README.md
git commit -m "Initialize telemetry branch"
git push origin telemetry-data
```

#### 2. Create GitHub Token

1. GitHub Settings → Developer Settings → Personal Access Tokens
2. Generate New Token (classic)
3. Select scopes: `repo` (full control)
4. Generate and copy token

#### 3. Configure MCP Server

Add to `.env`:
```bash
TELEMETRY_ENABLED=true
GITHUB_TOKEN=ghp_your_token_here
GITHUB_REPO=n8daniels/FedDocMCP
TELEMETRY_BRANCH=telemetry-data
```

Install dependencies:
```bash
pip install aiohttp
```

Use `GitHubTelemetryClient` from `src/utils/telemetry_github.py`

#### 4. Frontend Integration

Use the code from `docs/analytics-github.html`.

Metrics are stored at:
```
https://raw.githubusercontent.com/n8daniels/FedDocMCP/telemetry-data/metrics/2024-01-15.json
```

Your frontend fetches these JSON files directly.

---

## Option 4: Self-Hosted Analytics Server

If you want full control, deploy a simple Express.js or Flask API.

**Not recommended unless you have specific privacy/compliance requirements.**

---

## Integration with Your Figma Site

### Step 1: Export Figma Design as HTML

Your Figma site should export to HTML/CSS/JS.

### Step 2: Add Analytics JavaScript

Insert one of these into your exported HTML:

**For Firebase:**
```html
<script type="module">
  import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
  import { getDatabase, ref, onValue } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

  // Your Firebase config and analytics code here
</script>
```

**For GitHub:**
```html
<script>
  async function fetchMetrics() {
    const today = new Date().toISOString().split('T')[0];
    const response = await fetch(
      `https://raw.githubusercontent.com/n8daniels/FedDocMCP/telemetry-data/metrics/${today}.json`
    );
    return await response.json();
  }

  // Update your Figma dashboard with real data
  fetchMetrics().then(updateDashboard);
</script>
```

### Step 3: Map Data to Figma Elements

Your Figma design likely has placeholder elements with IDs. Update them:

```javascript
// Example: Update cache hit rate
document.getElementById('cache-hit-rate').textContent = `${metrics.cache_hit_rate}%`;

// Example: Update status badge
const statusEl = document.getElementById('status-badge');
statusEl.textContent = metrics.error_count > 10 ? '❌ ERRORS' : '✅ HEALTHY';

// Example: Update chart
updateChart(metrics.tool_calls);
```

### Step 4: Add Auto-Refresh

```javascript
// Refresh every 5 minutes
setInterval(async () => {
  const metrics = await fetchMetrics();
  updateDashboard(metrics);
}, 5 * 60 * 1000);
```

---

## Privacy & Transparency

### What Data is Collected?

**Collected (Anonymous Aggregates):**
- ✅ Cache hit rates
- ✅ Average response times
- ✅ Tool usage counts (how many times each tool was called)
- ✅ API call counts
- ✅ Error counts

**NOT Collected:**
- ❌ User identities
- ❌ Search queries
- ❌ Bill content
- ❌ IP addresses
- ❌ API keys

### User Opt-Out

Users can disable telemetry:

```bash
# In their .env or MCP client config
TELEMETRY_ENABLED=false
```

### Transparency

1. Document what data you collect in README
2. Make analytics dashboard public
3. Link to telemetry source code
4. Provide opt-out instructions

---

## Deployment Checklist

- [ ] Choose backend (Firebase, Supabase, or GitHub)
- [ ] Set up backend storage
- [ ] Add telemetry to MCP server
- [ ] Test metrics collection locally
- [ ] Integrate with Figma frontend
- [ ] Deploy frontend to GitHub Pages
- [ ] Test live dashboard
- [ ] Document privacy policy
- [ ] Add opt-out instructions to README

---

## Testing

### Test Locally

```bash
# Start MCP server
python src/server.py

# In another terminal, make some requests
# (use Claude Desktop or MCP Inspector)

# Check metrics are being sent
tail -f logs/telemetry.log
```

### Test Frontend

```bash
# Serve locally
python -m http.server 8000 --directory docs/

# Open browser
open http://localhost:8000/analytics.html
```

### Test End-to-End

1. Make requests to MCP server
2. Wait for telemetry batch (or trigger manually)
3. Refresh analytics dashboard
4. Verify metrics update

---

## Troubleshooting

### Firebase: "Permission denied"
- Check Firebase Rules
- Ensure service account key is correct
- Verify `FIREBASE_CREDENTIALS_PATH` is set

### Supabase: "Invalid API key"
- Use `service_role` key for server writes
- Use `anon` key for frontend reads
- Check API keys in Supabase dashboard

### GitHub: "API rate limit exceeded"
- Reduce telemetry frequency
- Use GitHub Apps instead of personal tokens
- Batch multiple metrics into one commit

### Frontend: "No data loading"
- Check browser console for errors
- Verify URLs are correct
- Check CORS settings
- Ensure GitHub branch/file exists

---

## Next Steps

1. Choose your backend (Firebase recommended for ease)
2. Follow the setup steps above
3. Integrate analytics into your Figma site
4. Deploy to GitHub Pages
5. Share your analytics dashboard with users!

---

## Example Analytics Dashboard URLs

Once deployed, your analytics will be at:

- **Firebase version:** `https://n8daniels.github.io/FedDocMCP/analytics.html`
- **GitHub version:** `https://n8daniels.github.io/FedDocMCP/analytics-github.html`
- **Custom domain:** `https://feddocmcp.com/analytics` (if you set up custom domain)

---

## Questions?

Open an issue or discussion on GitHub if you need help setting this up!
