import { defineFunction } from '@aws-amplify/backend';

export const getUserBySessionTokenFn = defineFunction({
  name: 'getUserBySessionToken',
  entry: './handler.ts',
  resourceGroupName: 'data',
});