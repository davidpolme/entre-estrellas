import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
} from '@aws-sdk/lib-dynamodb';

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export async function handler(event: any) {
  try {
    const identity = event.identity;
    if (!identity) throw new Error('No autenticado');

    const userId = identity.claims.sub ?? identity.username;
    const input = typeof event.arguments.input === 'string'
      ? JSON.parse(event.arguments.input)
      : event.arguments.input;

    const { username, starColor } = input;

    if (!username?.trim()) throw new Error('Nombre de usuario requerido');
    if (!starColor) throw new Error('Color de estrella requerido');

    const now = new Date().toISOString();
    const validColors = ['blue', 'white', 'yellow', 'orange', 'red'];
    if (!validColors.includes(starColor)) throw new Error('Color inválido');

    const hashCode = userId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const x = ((hashCode % 100) / 100) * 0.3 + 0.35;
    const y = ((hashCode * 7 % 100) / 100) * 0.3 + 0.35;

    const tableUserProfile = process.env.TABLE_USERPROFILE!;
    const tableEvent = process.env.TABLE_EVENT!;

    await client.send(new PutCommand({
      TableName: tableUserProfile,
      Item: {
        id: userId,
        username,
        starColor,
        x,
        y,
        communityLetterCompleted: false,
        createdAt: now,
      },
      ConditionExpression: 'attribute_not_exists(id)',
    }));

    try {
      await client.send(new PutCommand({
        TableName: tableEvent,
        Item: {
          id: 'current',
          status: 'REGISTRATION_OPEN',
          startedAt: null,
          finishedAt: null,
        },
        ConditionExpression: 'attribute_not_exists(id)',
      }));
    } catch {
      // Event already exists
    }

    return {
      id: userId,
      username,
      starColor,
      x,
      y,
      communityLetterCompleted: false,
      createdAt: now,
    };
  } catch (error: any) {
    console.error('registerUser error:', error);
    throw error;
  }
}