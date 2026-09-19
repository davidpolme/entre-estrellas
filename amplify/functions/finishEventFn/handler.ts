import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  UpdateCommand,
  GetCommand,
} from '@aws-sdk/lib-dynamodb';

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));

async function resolveAdmin(sessionToken: string): Promise<void> {
  const tableSession = process.env.TABLE_SESSION!;
  const tableUserProfile = process.env.TABLE_USERPROFILE!;

  const sessionRes = await client.send(new GetCommand({
    TableName: tableSession,
    Key: { token: sessionToken },
  }));
  if (!sessionRes.Item) throw new Error('Sesión inválida o expirada');

  const userRes = await client.send(new GetCommand({
    TableName: tableUserProfile,
    Key: { id: sessionRes.Item.userId },
  }));
  if (!userRes.Item?.isAdmin) throw new Error('No tienes permisos de administrador');
}

export async function handler(event: any) {
  try {
    const sessionToken = event.arguments.sessionToken;
    if (!sessionToken) throw new Error('No autenticado');
    await resolveAdmin(sessionToken);

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