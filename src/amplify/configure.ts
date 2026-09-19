import { Amplify } from 'aws-amplify';
import outputs from '../../amplify_outputs.json';

export function configureAmplify(): void {
  Amplify.configure(outputs);
}