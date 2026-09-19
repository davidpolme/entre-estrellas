import { defineFunction } from '@aws-amplify/backend';

export const sendDirectLetterFn = defineFunction({
  name: 'sendDirectLetter',
  entry: './handler.ts',
});