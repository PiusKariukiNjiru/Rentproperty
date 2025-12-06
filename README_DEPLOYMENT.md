# Deployment Guide

## Frontend Deployment (Vercel)

### Environment Variables

Set these in your Vercel project settings:

1. **VITE_API_BASE_URL**: Your backend API URL
   - For production: `https://your-backend-domain.com/api`
   - Example: `https://localrent-api.railway.app/api`

### Steps

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add the `VITE_API_BASE_URL` environment variable in Vercel project settings
4. Deploy

## Backend Deployment

### Recommended Platforms
- **Railway**: Easy Node.js deployment
- **Render**: Free tier available
- **Heroku**: Paid option
- **DigitalOcean App Platform**: Good performance

### Environment Variables

Set these in your backend hosting platform:

1. **MONGO_URI**: Your MongoDB connection string
2. **JWT_SECRET**: A secure random string for JWT signing
3. **PORT**: Server port (usually auto-set by platform)
4. **CLIENT_URL**: Your frontend URL (e.g., `https://rentproperties.vercel.app`)

### CORS Configuration

The backend is already configured to allow:
- Local development URLs
- Vercel production domain
- Vercel preview deployments

If you deploy to a different frontend domain, update `backend/server.js` to include your domain in the `allowedOrigins` array.

## Troubleshooting

### CORS Errors
- Ensure your backend CORS includes your frontend URL
- Check that `CLIENT_URL` environment variable is set correctly in backend

### API Connection Errors
- Verify `VITE_API_BASE_URL` is set in Vercel
- Ensure backend is deployed and accessible
- Check backend logs for errors

### Tailwind CSS Not Working
- Ensure `index.css` is imported in `index.tsx`
- Run `npm run build` locally to test
- Check that Tailwind is installed: `npm list tailwindcss`



