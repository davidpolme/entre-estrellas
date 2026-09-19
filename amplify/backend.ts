import { defineBackend } from '@aws-amplify/backend';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { data } from './data/resource';
import { startEventFn } from './functions/startEventFn/resource';
import { finishEventFn } from './functions/finishEventFn/resource';
import { sendCommunityLetterFn } from './functions/sendCommunityLetterFn/resource';
import { sendDirectLetterFn } from './functions/sendDirectLetterFn/resource';
import { markLetterReadFn } from './functions/markLetterReadFn/resource';
import { registerUserFn } from './functions/registerUserFn/resource';
import { loginUserFn } from './functions/loginUserFn/resource';
import { getUserBySessionTokenFn } from './functions/getUserBySessionTokenFn/resource';
import { getAdminStatsFn } from './functions/getAdminStatsFn/resource';

const backend = defineBackend({
  data,
  startEventFn,
  finishEventFn,
  sendCommunityLetterFn,
  sendDirectLetterFn,
  markLetterReadFn,
  registerUserFn,
  loginUserFn,
  getUserBySessionTokenFn,
  getAdminStatsFn,
});

// Grant DynamoDB access to all Lambda functions
const tables = backend.data.resources.tables;
const allFunctions = [
  backend.startEventFn,
  backend.finishEventFn,
  backend.sendCommunityLetterFn,
  backend.sendDirectLetterFn,
  backend.markLetterReadFn,
  backend.registerUserFn,
  backend.loginUserFn,
  backend.getUserBySessionTokenFn,
  backend.getAdminStatsFn,
];

const tableMap: Record<string, string> = {};

allFunctions.forEach(fn => {
  Object.entries(tables).forEach(([modelName, table]) => {
    const tableName = table.tableName;
    const envKey = `TABLE_${modelName.toUpperCase()}`;
    tableMap[envKey] = tableName;

    fn.resources.lambda.addToRolePolicy(
      new PolicyStatement({
        actions: [
          'dynamodb:PutItem',
          'dynamodb:GetItem',
          'dynamodb:UpdateItem',
          'dynamodb:DeleteItem',
          'dynamodb:Scan',
          'dynamodb:Query',
        ],
        resources: [table.tableArn, `${table.tableArn}/*`],
      })
    );
  });
});

// Pass table names to all functions
allFunctions.forEach(fn => {
  Object.entries(tableMap).forEach(([key, name]) => {
    fn.addEnvironment(key, name);
  });
});

export default backend;