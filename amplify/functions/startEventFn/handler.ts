import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  ScanCommand,
  TransactWriteCommand,
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

function getTable(name: string): string {
  return process.env[name] ?? '';
}

function generateDerangement(n: number): number[] | null {
  const maxAttempts = 100;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const arr = Array.from({ length: n }, (_, i) => i);
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    let valid = true;
    for (let i = 0; i < n; i++) {
      if (arr[i] === i) { valid = false; break; }
    }
    if (valid) return arr;
  }
  return null;
}

export async function handler(event: any) {
  try {
    const sessionToken = event.arguments.sessionToken;
    if (!sessionToken) throw new Error('No autenticado');
    await resolveAdmin(sessionToken);

    const tableUserProfile = getTable('TABLE_USERPROFILE');
    const tableAssignment = getTable('TABLE_COMMUNITYASSIGNMENT');
    const tableEvent = getTable('TABLE_EVENT');

    const scanResult = await client.send(new ScanCommand({
      TableName: tableUserProfile,
    }));

    const users = scanResult.Items ?? [];
    if (users.length < 2) {
      throw new Error('Se necesitan al menos 2 participantes');
    }

    const mapping = generateDerangement(users.length);
    if (!mapping) {
      throw new Error('No se pudo generar una asignación válida');
    }

    const now = new Date().toISOString();
    const transactItems: any[] = [];

    for (let i = 0; i < users.length; i++) {
      const sender = users[i];
      const recipient = users[mapping[i]!];
      transactItems.push({
        Put: {
          TableName: tableAssignment,
          Item: {
            senderId: sender.id,
            recipientId: recipient.id,
            completed: false,
            createdAt: now,
            completedAt: null,
          },
          ConditionExpression: 'attribute_not_exists(senderId)',
        },
      });
    }

    transactItems.push({
      Update: {
        TableName: tableEvent,
        Key: { id: 'current' },
        UpdateExpression: 'SET #status = :status, startedAt = :startedAt',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: {
          ':status': 'ACTIVE',
          ':startedAt': now,
        },
      },
    });

    await client.send(new TransactWriteCommand({ TransactItems: transactItems }));

    return { id: 'current', status: 'ACTIVE', startedAt: now, finishedAt: null };
  } catch (error: any) {
    console.error('startEvent error:', error);
    throw error;
  }
}