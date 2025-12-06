# ⚠️ CRITICAL: Vercel Environment Variable Setup

## The Problem
Your app is still trying to connect to `localhost:5001` because `VITE_API_BASE_URL` is **NOT SET** in Vercel.

## Step-by-Step Fix (DO THIS NOW)

### 1. Get Your Render Backend URL
- Go to [Render Dashboard](https://dashboard.render.com)
- Click on your backend service
- Copy the **Service URL** (e.g., `https://your-app-name.onrender.com`)
- **Add `/api` to the end**: `https://your-app-name.onrender.com/api`

### 2. Set Environment Variable in Vercel

**IMPORTANT: Follow these exact steps**

1. Go to [vercel.com](https://vercel.com) and **log in**
2. Click on your project: **rentproperties** (or whatever it's named)
3. Click **Settings** (top menu)
4. Click **Environment Variables** (left sidebar)
5. Click **Add New** button
6. Fill in:
   - **Key**: `VITE_API_BASE_URL`
   - **Value**: `https://your-render-backend-url.onrender.com/api` (replace with YOUR actual Render URL)
   - **Environment**: Check ALL THREE boxes:
     - ✅ Production
     - ✅ Preview  
     - ✅ Development
7. Click **Save**

### 3. **CRITICAL: Redeploy Your Project**

**You MUST redeploy after adding the environment variable!**

1. Go to **Deployments** tab (top menu)
2. Find your latest deployment
3. Click the **three dots (⋯)** on the right
4. Click **Redeploy**
5. Wait for the deployment to complete (2-3 minutes)

### 4. Verify It's Working

1. Open your deployed site: `https://rentproperties.vercel.app`
2. Open browser **Developer Tools** (F12)
3. Go to **Console** tab
4. You should see: `🔧 API Configuration:` with your Render URL
5. If you see `❌ ERROR: VITE_API_BASE_URL is not set`, the variable wasn't set correctly

### 5. Clear Browser Cache

- Press `Ctrl + Shift + Delete` (Windows) or `Cmd + Shift + Delete` (Mac)
- Select "Cached images and files"
- Click "Clear data"
- Refresh your site with `Ctrl + F5` (hard refresh)

## Common Mistakes

❌ **Mistake 1**: Setting the variable but not redeploying
- **Fix**: You MUST redeploy after adding environment variables

❌ **Mistake 2**: Wrong URL format
- **Wrong**: `https://your-app.onrender.com` (missing `/api`)
- **Right**: `https://your-app.onrender.com/api`

❌ **Mistake 3**: Only setting for Production
- **Fix**: Set for ALL environments (Production, Preview, Development)

❌ **Mistake 4**: Typo in variable name
- **Wrong**: `VITE_API_BASE_URL` (typo)
- **Right**: `VITE_API_BASE_URL` (exact spelling)

## Still Not Working?

1. **Check Vercel Build Logs**:
   - Go to Deployments → Click on latest deployment → View Build Logs
   - Look for `VITE_API_BASE_URL` in the logs
   - If you see `undefined`, the variable isn't set

2. **Verify Variable is Set**:
   - Go to Settings → Environment Variables
   - Confirm `VITE_API_BASE_URL` is listed
   - Check the value is correct (should end with `/api`)

3. **Check Browser Console**:
   - Open DevTools → Console
   - Look for the `🔧 API Configuration:` log
   - This shows what URL the app is actually using

4. **Try Hard Refresh**:
   - `Ctrl + F5` (Windows) or `Cmd + Shift + R` (Mac)
   - This clears cached JavaScript files

## Quick Test

After redeploying, check the browser console. You should see:
```
🔧 API Configuration: {
  'VITE_API_BASE_URL from env': 'https://your-render-url.onrender.com/api',
  'Using API_BASE_URL': 'https://your-render-url.onrender.com/api',
  'Is Production': true,
  'Is Development': false
}
```

If you see `'VITE_API_BASE_URL from env': undefined`, the variable is NOT set correctly in Vercel.



