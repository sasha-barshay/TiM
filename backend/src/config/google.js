const { OAuth2Client } = require('google-auth-library');

// Google OAuth configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

// Create OAuth2 client
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// Verify Google ID token
const verifyGoogleToken = async (idToken) => {
  if (!GOOGLE_CLIENT_ID) {
    throw new Error('Google OAuth not configured');
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID
    });

    return ticket.getPayload();
  } catch (error) {
    console.error('Google token verification failed:', error);
    throw new Error('Invalid Google token');
  }
};

// Extract user info from Google payload
const extractGoogleUserInfo = (payload) => {
  return {
    email: payload.email,
    name: payload.name,
    picture: payload.picture,
    emailVerified: payload.email_verified,
    sub: payload.sub, // Google user ID
    locale: payload.locale,
    givenName: payload.given_name,
    familyName: payload.family_name
  };
};

module.exports = {
  googleClient,
  verifyGoogleToken,
  extractGoogleUserInfo,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET
}; 