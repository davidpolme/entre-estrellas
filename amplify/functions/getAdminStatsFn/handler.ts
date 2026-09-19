import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  ScanCommand,
  GetCommand,
} from '@aws-sdk/lib-dynamodb';

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));

async function resolveSession(sessionToken: string): Promise<{ userId: string; isAdmin: boolean }> {
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
  if (!userRes.Item) throw new Error('Usuario no encontrado');

  return { userId: sessionRes.Item.userId, isAdmin: userRes.Item.isAdmin ?? false };
}

export async function handler(event: any) {
  try {
    const sessionToken = event.arguments.sessionToken;
    if (!sessionToken) throw new Error('No autenticado');

    const { isAdmin } = await resolveSession(sessionToken);
    if (!isAdmin) throw new Error('No tienes permisos de administrador');

    const tableUserProfile = process.env.TABLE_USERPROFILE!;
    const tableLetter = process.env.TABLE_LETTER!;
    const tableConnection = process.env.TABLE_CONNECTION!;
    const tableEvent = process.env.TABLE_EVENT!;

    const [users, letters, connections, eventItem] = await Promise.all([
      client.send(new ScanCommand({ TableName: tableUserProfile })),
      client.send(new ScanCommand({ TableName: tableLetter })),
      client.send(new ScanCommand({ TableName: tableConnection })),
      client.send(new GetCommand({ TableName: tableEvent, Key: { id: 'current' } })),
    ]);

    const colorDist: Record<string, number> = {};
    users.Items?.forEach((u: any) => {
      colorDist[u.starColor] = (colorDist[u.starColor] ?? 0) + 1;
    });

    const communityLetters = letters.Items?.filter((l: any) => l.type === 'COMMUNITY') ?? [];

    return {
      totalParticipants: users.Items?.length ?? 0,
      colorDistribution: colorDist,
      eventStatus: eventItem.Item?.status ?? 'REGISTRATION_OPEN',
      communityLettersSent: communityLetters.length,
      totalLetters: letters.Items?.length ?? 0,
      totalConnections: connections.Items?.length ?? 0,
    };
  } catch (error: any) {
    console.error('getAdminStats error:', error);
    throw error;
  }
}