# Custom Domain Setup for TiM

## Domain: tim.barlys.com

### 1. Render Static Site Configuration

1. Go to [Render Dashboard - tim-frontend](https://dashboard.render.com/static/srv-d3cec0j7mgec73ae5dn0)
2. Navigate to **Settings** tab
3. Scroll to **Custom Domain** section
4. Click **Add Custom Domain**
5. Enter: `tim.barlys.com`
6. Click **Save**

### 2. DNS Configuration

Add the following DNS record to your DNS provider (where barlys.com is hosted):

```
Type:  CNAME
Name:  tim
Value: tim-frontend.onrender.com
TTL:   3600 (or Auto)
```

**Alternative (if you need to use the root domain):**
If your DNS provider doesn't support CNAME for root domains, use an ALIAS or ANAME record pointing to `tim-frontend.onrender.com`.

### 3. Backend CORS Configuration

✅ **Already configured!** The backend has been updated to accept requests from:
- `https://tim.barlys.com` (custom domain)
- `https://tim-frontend.onrender.com` (Render default domain)
- `http://localhost:3001` (local development)

Environment variables set:
- `FRONTEND_URL=https://tim.barlys.com`
- `ALLOWED_ORIGINS=https://tim.barlys.com,https://tim-frontend.onrender.com,http://localhost:3001`

### 4. Google OAuth Configuration

**IMPORTANT**: You must update Google OAuth settings to include the custom domain:

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Select your OAuth 2.0 Client ID: `38029766832-datp9enkof3h02j822vm1bh83kqm8fr8.apps.googleusercontent.com`
3. Add to **Authorized JavaScript origins**:
   - `https://tim.barlys.com`
4. Add to **Authorized redirect URIs**:
   - `https://tim.barlys.com`
5. Click **Save**

### 5. SSL Certificate

Render will automatically provision a free SSL certificate via Let's Encrypt once:
1. The custom domain is added in Render
2. The DNS records are properly configured
3. DNS propagation is complete (can take 5-60 minutes)

You can check the SSL certificate status in the Render dashboard under the custom domain section.

### 6. Verification

Once DNS propagates and SSL is provisioned:

1. Visit: `https://tim.barlys.com`
2. Test login with Google OAuth
3. Verify all functionality works

### Troubleshooting

- **DNS not resolving**: Wait for DNS propagation (use `dig tim.barlys.com` to check)
- **SSL certificate pending**: Can take up to 1 hour for Let's Encrypt to issue
- **CORS errors**: Verify backend environment variables are set correctly
- **OAuth errors**: Ensure Google OAuth settings include the custom domain

## Current URLs

- **Primary (Custom)**: https://tim.barlys.com
- **Secondary (Render)**: https://tim-frontend.onrender.com
- **Backend**: https://tim-backend-zg6w.onrender.com
- **Backend Health**: https://tim-backend-zg6w.onrender.com/api/health

