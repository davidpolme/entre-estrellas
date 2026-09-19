import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
} from '@aws-sdk/lib-dynamodb';

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export async function handler(event: any) {
  try {
    const sessionToken = event.arguments.sessionToken;
    if (!sessionToken) throw new Error('Token requerido');

    const tableSession = process.env.TABLE_SESSION!;
    const tableUserProfile = process.env.TABLE_USERPROFILE!;

    const sessionRes = await client.send(new GetCommand({
      TableName: tableSession,
      Key: { token: sessionToken },
    }));
    if (!sessionRes.Item) throw new Error('Sesión inválida');

    const userRes = await client.send(new GetCommand({
      TableName: tableUserProfile,
      Key: { id: sessionRes.Item.userId },
    }));
    if (!userRes.Item) throw new Error('Usuario no encontrado');

    const user = userRes.Item;

    return {
      id: user.id,
      username: user.username,
      starColor: user.starColor,
      x: user.x,
      y: user.y,
      communityLetterCompleted: user.communityLetterCompleted ?? false,
      isAdmin: user.isAdmin ?? false,
      createdAt: user.createdAt,
    };
  } catch (error: any) {
    console.error('getUserBySessionToken error:', error);
    throw error;
  }
}