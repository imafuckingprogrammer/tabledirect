# TableDirect Setup Guide

## Quick Fix for Form Issues

Your forms are not working because the Supabase environment variables are missing. Here's how to fix it:

### 1. Create Environment File

Create a `.env` file in your project root (same directory as `package.json`) with the following content:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Get Your Supabase Credentials

1. Go to [supabase.com](https://supabase.com)
2. Sign in to your account
3. Select your project (or create a new one)
4. Go to Settings → API
5. Copy the following values:
   - **Project URL** → use for `VITE_SUPABASE_URL`
   - **anon public** key → use for `VITE_SUPABASE_ANON_KEY`

### 3. Restart Development Server

After creating the `.env` file:

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

### 4. Verify Configuration

Open your browser's developer console (F12). You should see:
- ✅ Configuration loaded successfully

If you see error messages, double-check your `.env` file format.

## Common Issues

### Forms Submit But Nothing Happens
- **Cause**: Missing or incorrect Supabase credentials
- **Fix**: Follow steps 1-3 above

### "Checking auth" Gets Stuck
- **Cause**: Network connection to Supabase fails
- **Fix**: Verify your Supabase URL and key are correct

### Database Errors
- **Cause**: Database tables don't exist
- **Fix**: Run the SQL migrations in your Supabase dashboard

## Need Help?

1. Check the browser console for error messages
2. Verify your `.env` file exists and has the correct format
3. Make sure your Supabase project is active and accessible 