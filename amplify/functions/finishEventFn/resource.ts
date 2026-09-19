import { defineFunction } from '@aws-amplify/backend';

export const finishEventFn = defineFunction({
  name: 'finishEvent',
  entry: './handler.ts',
});