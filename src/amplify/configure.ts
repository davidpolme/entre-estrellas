import { Amplify } from 'aws-amplify';

const awsConfig = {
  API: {
    GraphQL: {
      endpoint: import.meta.env.VITE_APPSYNC_ENDPOINT ?? '',
      defaultAuthMode: 'apiKey' as const,
      apiKey: import.meta.env.VITE_APPSYNC_API_KEY ?? '',
    },
  },
};

export function configureAmplify(): void {
  if (!import.meta.env.VITE_APPSYNC_ENDPOINT) {
    console.warn('Amplify not configured: missing VITE_APPSYNC_ENDPOINT');
    return;
  }
  Amplify.configure(awsConfig);
}