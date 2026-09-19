import { defineFunction } from '@aws-amplify/backend';

export const registerUserFn = defineFunction({
  name: 'registerUser',
  entry: './handler.ts',
  resourceGroupName: 'data',
});