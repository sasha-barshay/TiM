# Google OAuth Setup Guide

This guide will help you set up Google OAuth for the TiM application.

## Prerequisites

- Google Cloud Console account
- Access to create OAuth 2.0 credentials

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API and Google OAuth2 API

## Step 2: Configure OAuth Consent Screen

1. Go to "APIs & Services" > "OAuth consent screen"
2. Choose "External" user type
3. Fill in the required information:
   - App name: "TiM - Time is Money"
   - User support email: Your email
   - Developer contact information: Your email
4. Add scopes:
   - `email`
   - `profile`
   - `openid`
5. Add test users (your email addresses)

## Step 3: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Choose "Web application"
4. Set the following:
   - Name: "TiM Web Client"
   - Authorized JavaScript origins:
     - `http://localhost:3001` (for development)
     - `https://your-domain.com` (for production)
   - Authorized redirect URIs:
     - `http://localhost:3001` (for development)
     - `https://your-domain.com` (for production)
5. Click "Create"
6. Copy the Client ID and Client Secret

## Step 4: Configure Environment Variables

### Backend Configuration

Create or update your `backend/.env` file:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
GOOGLE_CLIENT_TYPE=web
```

### Frontend Configuration

Create or update your `frontend/.env` file:

```env
# API Configuration
VITE_API_URL=http://localhost:3000

# Google OAuth Configuration
VITE_GOOGLE_CLIENT_ID=your-google-client-id-here

# Environment
VITE_NODE_ENV=development
```

## Step 5: Test the Setup

1. Start the backend server: `cd backend && npm run dev`
2. Start the frontend server: `cd frontend && npm run dev`
3. Navigate to `http://localhost:3001/login`
4. Click "Continue with Google"
5. Complete the OAuth flow

## Troubleshooting

### Common Issues

1. **"Google OAuth not configured"**
   - Check that `GOOGLE_CLIENT_ID` is set in backend `.env`
   - Restart the backend server

2. **"Invalid Google token"**
   - Verify the Client ID matches between frontend and backend
   - Check that the OAuth consent screen is configured correctly
   - Ensure test users are added to the OAuth consent screen

3. **"Redirect URI mismatch"**
   - Update the authorized redirect URIs in Google Cloud Console
   - Make sure the redirect URI matches exactly (including protocol and port)

4. **"Email not verified"**
   - The user's Google account email must be verified
   - Add the user as a test user in the OAuth consent screen

### Development vs Production

For production deployment:

1. Update the OAuth consent screen to "In production"
2. Add your production domain to authorized origins and redirect URIs
3. Update environment variables with production values
4. Ensure HTTPS is used in production

## Security Notes

- Never commit `.env` files to version control
- Use different OAuth credentials for development and production
- Regularly rotate OAuth client secrets
- Monitor OAuth usage in Google Cloud Console

## Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)
- [React OAuth Google Documentation](https://github.com/MomenSherif/react-oauth) 