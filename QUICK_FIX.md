# Quick Fix Guide

## ✅ Your Deployments Are Live!

- **Backend**: https://rentproperty-backend.onrender.com ✅
- **Frontend**: https://rentproperties.vercel.app ✅

## 🔍 Check Browser Console

1. **Open your site**: https://rentproperties.vercel.app
2. **Press F12** to open Developer Tools
3. **Go to Console tab**
4. **Look for this log**: `🔧 API Configuration:`

### What to Look For:

**✅ GOOD - Variable is set:**
```javascript
🔧 API Configuration: {
  'VITE_API_BASE_URL from env': 'https://rentproperty-backend.onrender.com/api',
  'Using API_BASE_URL': 'https://rentproperty-backend.onrender.com/api',
  'Is Production': true
}
```

**❌ BAD - Variable not set:**
```javascript
🔧 API Configuration: {
  'VITE_API_BASE_URL from env': 'NOT SET',
  'Using API_BASE_URL': 'http://localhost:5001/api',  // ← This is the problem!
  'Is Production': true
}
```

## If Variable is NOT SET:

### Step 1: Verify in Vercel
1. Go to: https://vercel.com → Your Project
2. **Settings** → **Environment Variables**
3. Check if `VITE_API_BASE_URL` exists
4. Value should be: `https://rentproperty-backend.onrender.com/api`
5. **Production checkbox MUST be checked** ✅

### Step 2: If Missing, Add It
1. Click **Add New**
2. **Key**: `VITE_API_BASE_URL`
3. **Value**: `https://rentproperty-backend.onrender.com/api`
4. **Environment**: Check **Production** ✅
5. Click **Save**

### Step 3: Redeploy
1. Go to **Deployments** tab
2. Click **3 dots (⋯)** on latest deployment
3. Click **Redeploy**
4. Wait 2-3 minutes

### Step 4: Clear Browser Cache
- Press `Ctrl + Shift + Delete`
- Select "Cached images and files"
- Click "Clear data"
- Refresh page with `Ctrl + F5`

## If Variable IS SET but Still Not Working:

1. **Check Network Tab** (F12 → Network)
   - Look for failed requests
   - Check if requests are going to Render URL or localhost

2. **Check CORS Errors**
   - If you see CORS errors, the backend needs to allow your Vercel domain
   - Backend should already be configured, but verify `CLIENT_URL` is set in Render

3. **Check Render Backend Logs**
   - Go to Render dashboard → Your service → Logs
   - See if requests are reaching the backend

## Test Your Backend Directly

Open in browser: https://rentproperty-backend.onrender.com/api/properties

If you see JSON data or an error message, the backend is working.
If you see "Cannot GET /api/properties", the route might need adjustment.

