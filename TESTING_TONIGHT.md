# Testing Guide for Tonight

## Step 1: Pull Latest Changes

```bash
cd C:\Users\n8dan\Desktop\Apps\CutTheCrap
git pull origin claude/open-tasks-01PGkUpVA6pAEWE7UwFhmvG8
```

## Step 2: Set Up Python Environment

```bash
# Install Python dependencies
cd packages\feddoc-mcp
pip install -r requirements.txt
cd ..\..
```

## Step 3: Get Congress API Key

1. Go to https://api.congress.gov/sign-up/
2. Fill out the form (takes 30 seconds)
3. Check your email for the API key
4. Copy the API key

## Step 4: Configure Environment

Create/edit `.env` in the root directory:

```
CONGRESS_API_KEY=paste_your_key_here
FEDDOC_MCP_PATH=./packages/feddoc-mcp/src/server.py
FEDDOC_MCP_ENABLED=true
```

## Step 5: Run the App

```bash
npm run dev
```

## Step 6: Test Bill Lookup

Open http://localhost:3000

Try these bills:
- `118/hr/3684` - Infrastructure Investment and Jobs Act
- `118/s/1` - First Senate bill of 118th Congress
- `117/hr/1` - For the People Act

### What to Test:
✅ Home page loads
✅ Search form accepts bill ID
✅ Bill detail page shows up
✅ Bill title and status display
✅ Dependencies section appears (might be empty depending on bill)
✅ No errors in browser console

## Common Issues:

### "Failed to connect to FedDocMCP"
- Check that Python is in your PATH: `python --version`
- Verify requirements are installed: `pip list | findstr mcp`
- Make sure `.env` has your API key

### "CONGRESS_API_KEY not set"
- Check `.env` file exists in root directory
- Restart `npm run dev` after adding the key

### Bill not found / 404
- Verify the bill ID format: `congress/type/number`
- Try a known bill like `118/hr/1`
- Check the Congress API key is valid

## Success Criteria:

✅ You can search for a bill
✅ Bill details display
✅ Status shows correctly
✅ Loading states work
✅ No crashes or errors

## Notes for Future Improvements:

### UX Issues Identified:
1. **Bill ID format too technical** - Most users won't know `117/hr/3684`
   - Need to accept: "HR 3684", "H.R. 3684", "Infrastructure bill"
   - Add autocomplete/suggestions
   - Show recent/popular bills

2. **Missing features for v1.1:**
   - Search by bill title or keywords
   - Autocomplete as you type
   - Recent bills list on home page
   - Bookmark/favorite bills
   - Share links to bills

These are tracked for the next iteration!

## If Everything Works:

🎉 **Congrats! CutTheCrap is fully functional!**

The app is now:
- Fetching real federal legislation data
- Building dependency graphs
- Caching intelligently
- Ready for production deployment

Next steps:
1. Add the FedDocMCP repo to GitHub
2. Improve search UX
3. Deploy to Vercel
