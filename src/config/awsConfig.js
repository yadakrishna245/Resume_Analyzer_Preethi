/**
 * AWS Amplify Configuration
 * 
 * NOTE: These are public client-side identifiers (User Pool ID, Client ID).
 * They are NOT secrets - they're meant to be in the frontend code.
 * Auth security comes from passwords + MFA, not from hiding these values.
 */

const awsConfig = {
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || 'us-east-1_1Bip77Xrc',
      userPoolClientId: import.meta.env.VITE_COGNITO_CLIENT_ID || '4natdrfm482mg2kp83tuhkkc0b',
      signUpVerificationMethod: 'code',
      loginWith: {
        email: true,
      },
      passwordFormat: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireNumbers: true,
        requireSpecialCharacters: false,
      },
      mfa: {
        status: 'optional',
        totpEnabled: true,
      },
    },
  },
};

export const AWS_REGION = import.meta.env.VITE_AWS_REGION || 'us-east-1';

export default awsConfig;
