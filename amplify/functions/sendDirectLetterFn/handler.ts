import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  TransactWriteCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

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

    const senderId = await resolveSession(sessionToken);
    const recipientId: string = event.arguments.recipientId;
    const content: string = event.arguments.content;

    if (!content?.trim()) throw new Error('El contenido no puede estar vacío');
    if (content.length > 2000) throw new Error('El contenido es demasiado largo');
    if (senderId === recipientId) throw new Error('No puedes enviarte una carta a ti mismo');

    const tableEvent = process.env.TABLE_EVENT!;
    const tableUserProfile = process.env.TABLE_USERPROFILE!;
    const tableLetter = process.env.TABLE_LETTER!;
    const tableConnection = process.env.TABLE_CONNECTION!;

    const eventRes = await client.send(new GetCommand({
      TableName: tableEvent,
      Key: { id: 'current' },
    }));
    if (!eventRes.Item || eventRes.Item.status !== 'ACTIVE') {
      throw new Error('El evento no está activo');
    }

    const recipientRes = await client.send(new GetCommand({
      TableName: tableUserProfile,
      Key: { id: recipientId },
    }));
    if (!recipientRes.Item) {
      throw new Error('El destinatario no existe');
    }

    const senderProfile = await client.send(new GetCommand({
      TableName: tableUserProfile,
      Key: { id: senderId },
    }));
    if (!senderProfile.Item?.communityLetterCompleted) {
      throw new Error('Debes completar la carta comunitaria primero');
    }

    const now = new Date().toISOString();
    const letterId = uuidv4();

    const transactItems: any[] = [
      {
        Put: {
          TableName: tableLetter,
          Item: {
            id: letterId,
            senderId,
            recipientId,
            type: 'DIRECT',
            content,
            createdAt: now,
            readAt: null,
          },
          ConditionExpression: 'attribute_not_exists(id)',
        },
      },
    ];

    const connectionsRes = await client.send(new ScanCommand({
      TableName: tableConnection,
      FilterExpression: '(userAId = :s AND userBId = :r) OR (userAId = :r AND userBId = :s)',
      ExpressionAttributeValues: {
        ':s': senderId,
        ':r': recipientId,
      },
    }));

    const existingConn = connectionsRes.Items?.[0];
    if (existingConn) {
      transactItems.push({
        Update: {
          TableName: tableConnection,
          Key: { id: existingConn.id },
          UpdateExpression: 'ADD letterCount :inc SET updatedAt = :now',
          ExpressionAttributeValues: {
            ':inc': 1,
            ':now': now,
          },
        },
      });
    } else {
      transactItems.push({
        Put: {
          TableName: tableConnection,
          Item: {
            id: uuidv4(),
            userAId: senderId,
            userBId: recipientId,
            letterCount: 1,
            createdAt: now,
            updatedAt: now,
          },
          ConditionExpression: 'attribute_not_exists(id)',
        },
      });
    }

    await client.send(new TransactWriteCommand({ TransactItems: transactItems }));

    return {
      id: letterId,
      senderId,
      recipientId,
      type: 'DIRECT',
      content,
      createdAt: now,
      readAt: null,
    };
  } catch (error: any) {
    console.error('sendDirectLetter error:', error);
    throw error;
  }
}