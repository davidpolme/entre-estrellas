import { Amplify } from 'aws-amplify';

const awsConfig = {
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_USER_POOL_ID ?? '',
      userPoolClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID ?? '',
    },
  },
  API: {
    GraphQL: {
      endpoint: import.meta.env.VITE_APPSYNC_ENDPOINT ?? '',
      defaultAuthMode: 'userPool' as const,
    },
  },
};

export function configureAmplify(): void {
  if (!import.meta.env.VITE_USER_POOL_ID || !import.meta.env.VITE_APPSYNC_ENDPOINT) {
    console.warn('Amplify not configured: missing environment variables');
    return;
  }
  Amplify.configure(awsConfig);
}