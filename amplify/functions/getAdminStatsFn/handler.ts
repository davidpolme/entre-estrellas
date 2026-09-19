import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  ScanCommand,
  GetCommand,
} from '@aws-sdk/lib-dynamodb';

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export async function handler(event: any) {
  try {
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