import React from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuthStore } from '../../stores/authStore';
import toast from 'react-hot-toast';

interface GoogleSignInButtonProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  className?: string;
}

const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onSuccess,
  onError,
  disabled = false,
  className = ''
}) => {
  const { loginWithGoogle } = useAuthStore();

  const login = useGoogleLogin({
    onSuccess: async (response) => {
      try {
        // Get the ID token from Google
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            code: response.code,
            client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
            redirect_uri: window.location.origin,
          }),
        });

        if (!tokenResponse.ok) {
          throw new Error('Failed to exchange code for token');
        }

        const tokenData = await tokenResponse.json();
        
        if (!tokenData.id_token) {
          throw new Error('No ID token received from Google');
        }

        await loginWithGoogle(tokenData.id_token);
        toast.success('Successfully signed in with Google!');
        onSuccess?.();
      } catch (error: any) {
        const errorMessage = error.message || 'Failed to sign in with Google';
        toast.error(errorMessage);
        onError?.(errorMessage);
      }
    },
    onError: (_error) => {
      const errorMessage = 'Google sign-in failed. Please try again.';
      toast.error(errorMessage);
      onError?.(errorMessage);
    },
    flow: 'auth-code',
    scope: 'email profile openid',
  });

  return (
    <button
      type="button"
      onClick={() => login()}
      disabled={disabled}
      className={`btn-secondary w-full py-3 text-base font-medium ${className}`}
    >
      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
        <path
          fill="currentColor"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="currentColor"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="currentColor"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="currentColor"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
      Continue with Google
    </button>
  );
};

export default GoogleSignInButton; 