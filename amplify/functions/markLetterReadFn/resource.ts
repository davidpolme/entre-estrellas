import { defineFunction } from '@aws-amplify/backend';

export const markLetterReadFn = defineFunction({
  name: 'markLetterRead',
  entry: './handler.ts',
  resourceGroupName: 'data',
});