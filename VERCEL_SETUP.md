# Vercel Environment Variables Setup

## Quick Fix for Your Deployment

Your frontend is trying to connect to `localhost:5001` because the `VITE_API_BASE_URL` environment variable is not set in Vercel.

## Steps to Fix:

### 1. Get Your Render Backend URL
- Go to your Render dashboard
- Find your backend service
- Copy the URL (e.g., `https://your-app-name.onrender.com`)
- Add `/api` to the end: `https://your-app-name.onrender.com/api`

### 2. Set Environment Variable in Vercel

**Option A: Via Vercel Dashboard (Recommended)**
1. Go to [vercel.com](https://vercel.com)
2. Select your project (`rentproperties`)
3. Go to **Settings** → **Environment Variables**
4. Click **Add New**
5. Add:
   - **Key**: `VITE_API_BASE_URL`
   - **Value**: `https://your-render-backend-url.onrender.com/api`
   - **Environment**: Select all (Production, Preview, Development)
6. Click **Save**
7. **Redeploy** your project (go to Deployments → click the 3 dots → Redeploy)

**Option B: Via Vercel CLI**
```bash
vercel env add VITE_API_BASE_URL
# Enter: https://your-render-backend-url.onrender.com/api
# Select: Production, Preview, Development
```

### 3. Update Backend CORS (If Needed)

Make sure your Render backend has the correct CORS settings. In your Render dashboard:

1. Go to your backend service
2. Go to **Environment** tab
3. Add/Update:
   - **CLIENT_URL**: `https://rentproperties.vercel.app`
4. Restart the service

The backend code already includes Vercel domains, but make sure `CLIENT_URL` is set.

### 4. Verify

After redeploying:
- Check browser console - should see requests to your Render URL, not localhost
- Test the app - properties should load

## Common Issues

**Still seeing localhost?**
- Make sure you redeployed after adding the env variable
- Check Vercel build logs to confirm the variable is being used
- Clear browser cache

**CORS errors?**
- Verify `CLIENT_URL` is set in Render backend
- Check backend logs for CORS errors
- Make sure your Render URL is in the allowed origins

