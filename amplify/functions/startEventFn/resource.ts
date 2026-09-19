import { defineFunction } from '@aws-amplify/backend';

export const startEventFn = defineFunction({
  name: 'startEvent',
  entry: './handler.ts',
  resourceGroupName: 'data',
});