import { a, defineData, type ClientSchema } from '@aws-amplify/backend';
import { startEventFn } from '../functions/startEventFn/resource';
import { finishEventFn } from '../functions/finishEventFn/resource';
import { sendCommunityLetterFn } from '../functions/sendCommunityLetterFn/resource';
import { sendDirectLetterFn } from '../functions/sendDirectLetterFn/resource';
import { markLetterReadFn } from '../functions/markLetterReadFn/resource';
import { registerUserFn } from '../functions/registerUserFn/resource';
import { loginUserFn } from '../functions/loginUserFn/resource';
import { getUserBySessionTokenFn } from '../functions/getUserBySessionTokenFn/resource';
import { getAdminStatsFn } from '../functions/getAdminStatsFn/resource';

const schema = a.schema({
  EventStatus: a.enum(['REGISTRATION_OPEN', 'ACTIVE', 'FINISHED']),
  LetterType: a.enum(['COMMUNITY', 'DIRECT']),
  StarColor: a.enum(['blue', 'white', 'yellow', 'orange', 'red']),

  UserProfile: a
    .model({
      id: a.id().required(),
      username: a.string().required(),
      passwordHash: a.string(),
      starColor: a.ref('StarColor').required(),
      x: a.float(),
      y: a.float(),
      communityLetterCompleted: a.boolean().required().default(false),
      isAdmin: a.boolean().default(false),
      createdAt: a.datetime().required(),
    })
    .authorization(allow => [allow.publicApiKey()]),

  Session: a
    .model({
      token: a.id().required(),
      userId: a.id().required(),
      createdAt: a.datetime().required(),
    })
    .authorization(allow => [allow.publicApiKey()]),

  Connection: a
    .model({
      id: a.id().required(),
      userAId: a.id().required(),
      userBId: a.id().required(),
      letterCount: a.integer().required().default(1),
      createdAt: a.datetime().required(),
      updatedAt: a.datetime().required(),
    })
    .authorization(allow => [allow.publicApiKey()]),

  Letter: a
    .model({
      id: a.id().required(),
      senderId: a.id().required(),
      recipientId: a.id().required(),
      type: a.ref('LetterType').required(),
      content: a.string().required(),
      createdAt: a.datetime().required(),
      readAt: a.datetime(),
    })
    .authorization(allow => [allow.publicApiKey()]),

  CommunityAssignment: a
    .model({
      senderId: a.id().required(),
      recipientId: a.id().required(),
      completed: a.boolean().required().default(false),
      createdAt: a.datetime().required(),
      completedAt: a.datetime(),
    })
    .authorization(allow => [allow.publicApiKey()]),

  Event: a
    .model({
      id: a.id().required(),
      status: a.ref('EventStatus').required(),
      startedAt: a.datetime(),
      finishedAt: a.datetime(),
    })
    .authorization(allow => [allow.publicApiKey()]),

  // Auth mutations
  registerUser: a
    .mutation()
    .arguments({ username: a.string().required(), password: a.string().required(), starColor: a.string().required() })
    .returns(a.json().required())
    .authorization(allow => [allow.publicApiKey()])
    .handler(a.handler.function(registerUserFn)),

  loginUser: a
    .mutation()
    .arguments({ username: a.string().required(), password: a.string().required() })
    .returns(a.json().required())
    .authorization(allow => [allow.publicApiKey()])
    .handler(a.handler.function(loginUserFn)),

  getUserBySessionToken: a
    .query()
    .arguments({ sessionToken: a.string().required() })
    .returns(a.json().required())
    .authorization(allow => [allow.publicApiKey()])
    .handler(a.handler.function(getUserBySessionTokenFn)),

  // Event mutations
  startEvent: a
    .mutation()
    .arguments({ sessionToken: a.string().required() })
    .returns(a.ref('Event').required())
    .authorization(allow => [allow.publicApiKey()])
    .handler(a.handler.function(startEventFn)),

  finishEvent: a
    .mutation()
    .arguments({ sessionToken: a.string().required() })
    .returns(a.ref('Event').required())
    .authorization(allow => [allow.publicApiKey()])
    .handler(a.handler.function(finishEventFn)),

  // Letter mutations
  sendCommunityLetter: a
    .mutation()
    .arguments({ content: a.string().required(), sessionToken: a.string().required() })
    .returns(a.ref('Letter').required())
    .authorization(allow => [allow.publicApiKey()])
    .handler(a.handler.function(sendCommunityLetterFn)),

  sendDirectLetter: a
    .mutation()
    .arguments({ recipientId: a.id().required(), content: a.string().required(), sessionToken: a.string().required() })
    .returns(a.ref('Letter').required())
    .authorization(allow => [allow.publicApiKey()])
    .handler(a.handler.function(sendDirectLetterFn)),

  markLetterRead: a
    .mutation()
    .arguments({ letterId: a.id().required(), sessionToken: a.string().required() })
    .returns(a.ref('Letter').required())
    .authorization(allow => [allow.publicApiKey()])
    .handler(a.handler.function(markLetterReadFn)),

  // Admin
  getAdminStats: a
    .query()
    .arguments({ sessionToken: a.string().required() })
    .returns(a.json().required())
    .authorization(allow => [allow.publicApiKey()])
    .handler(a.handler.function(getAdminStatsFn)),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'apiKey',
  },
});