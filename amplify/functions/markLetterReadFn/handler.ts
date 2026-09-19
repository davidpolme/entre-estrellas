import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  UpdateCommand,
  GetCommand,
} from '@aws-sdk/lib-dynamodb';

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));

async function resolveSession(sessionToken: string): Promise<string> {
  const tableSession = process.env.TABLE_SESSION!;
  const res = await client.send(new GetCommand({
    TableName: tableSession,
    Key: { token: sessionToken },
  }));
  if (!res.Item) throw new Error('Sesión inválida o expirada');
  return res.Item.userId;
}

export async function handler(event: any) {
  try {
    const sessionToken = event.arguments.sessionToken;
    if (!sessionToken) throw new Error('No autenticado');

    const userId = await resolveSession(sessionToken);
    const letterId: string = event.arguments.letterId;

    const tableLetter = process.env.TABLE_LETTER!;

    const letter = await client.send(new GetCommand({
      TableName: tableLetter,
      Key: { id: letterId },
    }));

    if (!letter.Item) throw new Error('Carta no encontrada');
    if (letter.Item.recipientId !== userId) throw new Error('No eres el destinatario');

    const now = new Date().toISOString();

    await client.send(new UpdateCommand({
      TableName: tableLetter,
      Key: { id: letterId },
      UpdateExpression: 'SET readAt = :readAt',
      ExpressionAttributeValues: { ':readAt': now },
    }));

    return { ...letter.Item, readAt: now };
  } catch (error: any) {
    console.error('markLetterRead error:', error);
    throw error;
  }
}