import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  TransactWriteCommand,
} from '@aws-sdk/lib-dynamodb';
import { randomBytes, scryptSync } from 'crypto';
import { v4 as uuidv4 } from 'uuid';

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function generateToken(): string {
  return randomBytes(24).toString('hex');
}

export async function handler(event: any) {
  try {
    const { username, password, starColor } = event.arguments;
    const normalizedUsername = username?.trim().toLowerCase();

    if (!normalizedUsername) throw new Error('Nombre de usuario requerido');
    if (!password || password.length < 6) throw new Error('La contraseña debe tener al menos 6 caracteres');
    if (!starColor) throw new Error('Color de estrella requerido');

    const validColors = ['blue', 'white', 'yellow', 'orange', 'red'];
    if (!validColors.includes(starColor)) throw new Error('Color inválido');

    const tableUserProfile = process.env.TABLE_USERPROFILE!;
    const tableUserCredential = process.env.TABLE_USERCREDENTIAL!;
    const tableSession = process.env.TABLE_SESSION!;
    const tableEvent = process.env.TABLE_EVENT!;

    const userId = uuidv4();
    const now = new Date().toISOString();
    const passwordHash = hashPassword(password);
    const token = generateToken();

    const hashCode = userId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const x = ((hashCode % 100) / 100) * 0.3 + 0.35;
    const y = ((hashCode * 7 % 100) / 100) * 0.3 + 0.35;

    await client.send(new TransactWriteCommand({
      TransactItems: [
        {
          Put: {
            TableName: tableUserCredential,
            Item: {
              username: normalizedUsername,
              userId,
              passwordHash,
              createdAt: now,
            },
            ConditionExpression: 'attribute_not_exists(username)',
          },
        },
        {
          Put: {
            TableName: tableUserProfile,
            Item: {
              id: userId,
              username: username.trim(),
              starColor,
              x,
              y,
              communityLetterCompleted: false,
              isAdmin: false,
              createdAt: now,
            },
            ConditionExpression: 'attribute_not_exists(id)',
          },
        },
        {
          Put: {
            TableName: tableSession,
            Item: {
              token,
              userId,
              createdAt: now,
            },
            ConditionExpression: 'attribute_not_exists(#token)',
            ExpressionAttributeNames: { '#token': 'token' },
          },
        },
      ],
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
      token,
      user: {
        id: userId,
        username: username.trim(),
        starColor,
        x,
        y,
        communityLetterCompleted: false,
        isAdmin: false,
        createdAt: now,
      },
    };
  } catch (error: any) {
    console.error('registerUser error:', error);
    if (error?.name === 'TransactionCanceledException') {
      throw new Error('Ese nombre de usuario ya está registrado');
    }
    throw error;
  }
}