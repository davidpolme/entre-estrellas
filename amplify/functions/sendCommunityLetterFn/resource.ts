import { defineFunction } from '@aws-amplify/backend';

export const sendCommunityLetterFn = defineFunction({
  name: 'sendCommunityLetter',
  entry: './handler.ts',
  resourceGroupName: 'data',
});