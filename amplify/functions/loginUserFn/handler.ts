import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
} from '@aws-sdk/lib-dynamodb';
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  const derived = scryptSync(password, salt, 64).toString('hex');
  try {
    return timingSafeEqual(Buffer.from(derived), Buffer.from(hash));
  } catch {
    return false;
  }
}

function generateToken(): string {
  return randomBytes(24).toString('hex');
}

export async function handler(event: any) {
  try {
    const { username, password } = event.arguments;

    if (!username?.trim()) throw new Error('Nombre de usuario requerido');
    if (!password) throw new Error('Contraseña requerida');

    const tableUserProfile = process.env.TABLE_USERPROFILE!;
    const tableUserCredential = process.env.TABLE_USERCREDENTIAL!;
    const tableSession = process.env.TABLE_SESSION!;

    const credentialRes = await client.send(new GetCommand({
      TableName: tableUserCredential,
      Key: { username: username.trim().toLowerCase() },
    }));
    const credential = credentialRes.Item;
    if (!credential || !verifyPassword(password, credential.passwordHash)) {
      throw new Error('Usuario o contraseña incorrectos');
    }

    const userRes = await client.send(new GetCommand({
      TableName: tableUserProfile,
      Key: { id: credential.userId },
    }));
    const user = userRes.Item;
    if (!user) throw new Error('Usuario no encontrado');

    // Create session token
    const token = generateToken();
    const now = new Date().toISOString();

    await client.send(new PutCommand({
      TableName: tableSession,
      Item: {
        token,
        userId: user.id,
        createdAt: now,
      },
      ConditionExpression: 'attribute_not_exists(#token)',
      ExpressionAttributeNames: { '#token': 'token' },
    }));

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        starColor: user.starColor,
        x: user.x,
        y: user.y,
        communityLetterCompleted: user.communityLetterCompleted ?? false,
        createdAt: user.createdAt,
        isAdmin: user.isAdmin ?? false,
      },
    };
  } catch (error: any) {
    console.error('loginUser error:', error);
    throw error;
  }
}