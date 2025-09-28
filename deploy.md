# TiM Deployment Guide for Render.com

## Prerequisites
1. GitHub repository with the TiM code
2. Render.com account
3. Google OAuth credentials configured

## Cost Overview
- **Frontend (Static Site)**: Free
- **Backend (Web Service)**: $7/month (Starter plan)
- **Database (PostgreSQL)**: Free (if available) or $7/month (Starter plan)
- **Total**: $0-$14/month depending on database plan availability

## Deployment Steps

### 1. Database Setup
1. Go to Render Dashboard
2. Click "New +" → "PostgreSQL"
3. Configure:
   - Name: `tim-database`
   - Plan: Free (if available) or Starter ($7/month)
   - Database Name: `tim_production`
   - User: `tim_user`
4. Note down the connection details

### 2. Backend Deployment
1. Go to Render Dashboard
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - Name: `tim-backend`
   - Root Directory: `backend`
   - Environment: Node
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Plan: Starter ($7/month) - Free tier no longer available for web services
5. Set Environment Variables:
   ```
   NODE_ENV=production
   JWT_SECRET=<generate a secure random string>
   GOOGLE_CLIENT_ID=38029766832-datp9enkof3h02j822vm1bh83kqm8fr8.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=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
   GOOGLE_CLIENT_TYPE=web
   FRONTEND_URL=https://tim-frontend.onrender.com
   ALLOWED_ORIGINS=https://tim-frontend.onrender.com,http://localhost:3001
   ```
6. Add Database Environment Variables (from step 1):
   ```
   DB_HOST=<from database>
   DB_PORT=<from database>
   DB_NAME=<from database>
   DB_USER=<from database>
   DB_PASSWORD=<from database>
   ```

### 3. Frontend Deployment
1. Go to Render Dashboard
2. Click "New +" → "Static Site"
3. Connect your GitHub repository
4. Configure:
   - Name: `tim-frontend`
   - Root Directory: `frontend`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`
   - Plan: Free (Static sites are still free)
5. Set Environment Variables:
   ```
   VITE_API_URL=https://tim-backend.onrender.com/api
   VITE_GOOGLE_CLIENT_ID=38029766832-datp9enkof3h02j822vm1bh83kqm8fr8.apps.googleusercontent.com
   VITE_NODE_ENV=production
   ```

### 4. Database Setup
After backend is deployed:
1. Go to backend service
2. Open Shell/Console
3. Run: `npm run db:setup`
4. Run: `npm run db:seed`

### 5. Google OAuth Configuration
Update Google OAuth settings:
1. Go to Google Cloud Console
2. Edit OAuth 2.0 Client
3. Add Authorized redirect URIs:
   - `https://tim-frontend.onrender.com`
4. Add Authorized JavaScript origins:
   - `https://tim-frontend.onrender.com`

## URLs After Deployment
- Frontend: `https://tim-frontend.onrender.com`
- Backend: `https://tim-backend.onrender.com`
- Health Check: `https://tim-backend.onrender.com/api/health`

## Testing
1. Visit the frontend URL
2. Test Google OAuth login
3. Test time entry creation
4. Test customer management (admin/account manager roles)

## Troubleshooting
- Check backend logs for database connection issues
- Verify environment variables are set correctly
- Ensure CORS is configured for the frontend URL
- Check Google OAuth redirect URIs match deployment URLs
