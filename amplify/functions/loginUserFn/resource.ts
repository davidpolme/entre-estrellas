import { defineFunction } from '@aws-amplify/backend';

export const loginUserFn = defineFunction({
  name: 'loginUser',
  entry: './handler.ts',
  resourceGroupName: 'data',
});