import { a, defineData, type ClientSchema } from '@aws-amplify/backend';
import { startEventFn } from '../functions/startEventFn/resource';
import { finishEventFn } from '../functions/finishEventFn/resource';
import { sendCommunityLetterFn } from '../functions/sendCommunityLetterFn/resource';
import { sendDirectLetterFn } from '../functions/sendDirectLetterFn/resource';
import { markLetterReadFn } from '../functions/markLetterReadFn/resource';
import { registerUserFn } from '../functions/registerUserFn/resource';
import { getAdminStatsFn } from '../functions/getAdminStatsFn/resource';

const schema = a.schema({
  EventStatus: a.enum(['REGISTRATION_OPEN', 'ACTIVE', 'FINISHED']),
  LetterType: a.enum(['COMMUNITY', 'DIRECT']),
  StarColor: a.enum(['blue', 'white', 'yellow', 'orange', 'red']),

  UserProfile: a
    .model({
      id: a.id().required(),
      username: a.string().required(),
      starColor: a.ref('StarColor').required(),
      x: a.float(),
      y: a.float(),
      communityLetterCompleted: a.boolean().required().default(false),
      createdAt: a.datetime().required(),
    })
    .authorization(allow => [
      allow.owner().to(['create', 'read', 'update']),
      allow.groups(['admins']).to(['read', 'update']),
      allow.authenticated().to(['read']),
    ]),

  Connection: a
    .model({
      id: a.id().required(),
      userAId: a.id().required(),
      userBId: a.id().required(),
      letterCount: a.integer().required().default(1),
      createdAt: a.datetime().required(),
      updatedAt: a.datetime().required(),
    })
    .authorization(allow => [
      allow.authenticated().to(['read']),
      allow.groups(['admins']).to(['read']),
    ]),

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
    .authorization(allow => [
      allow.ownerDefinedIn('recipientId').to(['read']),
      allow.ownerDefinedIn('senderId').to(['read']),
      allow.groups(['admins']).to(['read']),
    ]),

  CommunityAssignment: a
    .model({
      senderId: a.id().required(),
      recipientId: a.id().required(),
      completed: a.boolean().required().default(false),
      createdAt: a.datetime().required(),
      completedAt: a.datetime(),
    })
    .authorization(allow => [
      allow.ownerDefinedIn('senderId').to(['read', 'update']),
      allow.groups(['admins']).to(['read', 'update', 'delete']),
    ]),

  Event: a
    .model({
      id: a.id().required(),
      status: a.ref('EventStatus').required(),
      startedAt: a.datetime(),
      finishedAt: a.datetime(),
    })
    .authorization(allow => [
      allow.authenticated().to(['read']),
      allow.groups(['admins']).to(['create', 'read', 'update', 'delete']),
    ]),

  // Custom mutations — function-backed
  startEvent: a
    .mutation()
    .arguments({})
    .returns(a.ref('Event').required())
    .authorization(allow => [allow.groups(['admins'])])
    .handler(a.handler.function(startEventFn)),

  finishEvent: a
    .mutation()
    .arguments({})
    .returns(a.ref('Event').required())
    .authorization(allow => [allow.groups(['admins'])])
    .handler(a.handler.function(finishEventFn)),

  sendCommunityLetter: a
    .mutation()
    .arguments({ content: a.string().required() })
    .returns(a.ref('Letter').required())
    .authorization(allow => [allow.authenticated()])
    .handler(a.handler.function(sendCommunityLetterFn)),

  sendDirectLetter: a
    .mutation()
    .arguments({ recipientId: a.id().required(), content: a.string().required() })
    .returns(a.ref('Letter').required())
    .authorization(allow => [allow.authenticated()])
    .handler(a.handler.function(sendDirectLetterFn)),

  markLetterRead: a
    .mutation()
    .arguments({ letterId: a.id().required() })
    .returns(a.ref('Letter').required())
    .authorization(allow => [allow.authenticated()])
    .handler(a.handler.function(markLetterReadFn)),

  registerUser: a
    .mutation()
    .arguments({ input: a.json().required() })
    .returns(a.ref('UserProfile').required())
    .authorization(allow => [allow.authenticated()])
    .handler(a.handler.function(registerUserFn)),

  getAdminStats: a
    .query()
    .returns(a.json().required())
    .authorization(allow => [allow.groups(['admins'])])
    .handler(a.handler.function(getAdminStatsFn)),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});