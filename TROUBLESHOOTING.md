# Troubleshooting: Environment Variable Not Working

## Quick Verification Steps

### 1. Verify Variable is Set in Vercel
- Go to Vercel Dashboard → Your Project → Settings → Environment Variables
- Confirm `VITE_API_BASE_URL` exists
- Value should be: `https://rentproperty-backend.onrender.com/api` (no trailing slash issues)
- Make sure it's enabled for **Production** environment

### 2. Check Vercel Build Logs
- Go to Deployments → Click on latest deployment → View Logs
- Search for "VITE_API_BASE_URL" in the logs
- If you see it, the variable is being read
- If you don't see it, the variable isn't set correctly

### 3. Check Browser Console
After deploying, open your site and check the browser console (F12):
- You should see: `🔧 API Configuration:` log
- This shows what URL the app is actually using
- If it shows `undefined`, the variable isn't being read

### 4. Common Issues

**Issue 1: Variable not set for Production**
- Solution: Make sure you checked "Production" when adding the variable

**Issue 2: Didn't redeploy after setting variable**
- Solution: You MUST redeploy after adding/changing environment variables

**Issue 3: Browser cache**
- Solution: Hard refresh with Ctrl+F5 or clear cache

**Issue 4: Wrong variable name**
- Must be exactly: `VITE_API_BASE_URL` (case-sensitive)

**Issue 5: URL format**
- Correct: `https://rentproperty-backend.onrender.com/api`
- Wrong: `https://rentproperty-backend.onrender.com/api/` (trailing slash)
- Wrong: `https://rentproperty-backend.onrender.com` (missing /api)

### 5. Test the Variable

Add this to your code temporarily to test:
```typescript
console.log('Environment check:', {
  'import.meta.env': import.meta.env,
  'VITE_API_BASE_URL': import.meta.env.VITE_API_BASE_URL,
  'All env vars': Object.keys(import.meta.env)
});
```

### 6. Force Rebuild

If nothing works:
1. Delete the environment variable in Vercel
2. Save
3. Add it again with the correct value
4. Save
5. Redeploy



