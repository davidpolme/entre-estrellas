import { defineFunction } from '@aws-amplify/backend';

export const getAdminStatsFn = defineFunction({
  name: 'getAdminStats',
  entry: './handler.ts',
  resourceGroupName: 'data',
});