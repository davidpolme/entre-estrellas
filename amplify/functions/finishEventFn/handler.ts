import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export async function handler(event: any) {
  try {
    const now = new Date().toISOString();

    await client.send(new UpdateCommand({
      TableName: process.env.TABLE_EVENT!,
      Key: { id: 'current' },
      UpdateExpression: 'SET #status = :status, finishedAt = :finishedAt',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: {
        ':status': 'FINISHED',
        ':finishedAt': now,
      },
    }));

    return { id: 'current', status: 'FINISHED', finishedAt: now };
  } catch (error: any) {
    console.error('finishEvent error:', error);
    throw error;
  }
}