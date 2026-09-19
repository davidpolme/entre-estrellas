export const GET_EVENT = `
  query GetEvent {
    getEvent(id: "current") {
      id
      status
      startedAt
      finishedAt
    }
  }
`;

export const LIST_USERS = `
  query ListUsers {
    listUserProfiles {
      items {
        id
        username
        starColor
        x
        y
      }
    }
  }
`;

export const GET_USER_BY_SESSION_TOKEN = `
  query GetUserBySessionToken($sessionToken: String!) {
    getUserBySessionToken(sessionToken: $sessionToken)
  }
`;

export const LIST_CONNECTIONS = `
  query ListConnections {
    listConnections {
      items {
        id
        userAId
        userBId
        letterCount
        createdAt
        updatedAt
      }
    }
  }
`;

export const LIST_LETTERS = `
  query ListLetters {
    listLetters {
      items {
        id
        senderId
        recipientId
        type
        content
        createdAt
        readAt
      }
    }
  }
`;

export const GET_MY_ASSIGNMENT = `
  query GetMyAssignment($senderId: ID!) {
    getCommunityAssignment(senderId: $senderId) {
      senderId
      recipientId
      completed
      createdAt
      completedAt
    }
  }
`;

export const GET_ADMIN_STATS = `
  query GetAdminStats($sessionToken: String!) {
    getAdminStats(sessionToken: $sessionToken)
  }
`;

export const REGISTER_USER = `
  mutation RegisterUser($username: String!, $password: String!, $starColor: String!) {
    registerUser(username: $username, password: $password, starColor: $starColor)
  }
`;

export const LOGIN_USER = `
  mutation LoginUser($username: String!, $password: String!) {
    loginUser(username: $username, password: $password)
  }
`;

export const SEND_COMMUNITY_LETTER = `
  mutation SendCommunityLetter($content: String!, $sessionToken: String!) {
    sendCommunityLetter(content: $content, sessionToken: $sessionToken) {
      id
      senderId
      recipientId
      type
      content
      createdAt
    }
  }
`;

export const SEND_DIRECT_LETTER = `
  mutation SendDirectLetter($recipientId: ID!, $content: String!, $sessionToken: String!) {
    sendDirectLetter(recipientId: $recipientId, content: $content, sessionToken: $sessionToken) {
      id
      senderId
      recipientId
      type
      content
      createdAt
    }
  }
`;

export const START_EVENT = `
  mutation StartEvent($sessionToken: String!) {
    startEvent(sessionToken: $sessionToken) {
      id
      status
      startedAt
      finishedAt
    }
  }
`;

export const FINISH_EVENT = `
  mutation FinishEvent($sessionToken: String!) {
    finishEvent(sessionToken: $sessionToken) {
      id
      status
      startedAt
      finishedAt
    }
  }
`;

export const MARK_LETTER_READ = `
  mutation MarkLetterRead($letterId: ID!, $sessionToken: String!) {
    markLetterRead(letterId: $letterId, sessionToken: $sessionToken) {
      id
      readAt
    }
  }
`;

export const ON_USER_JOINED = `
  subscription OnUserJoined {
    onCreateUserProfile {
      id
      username
      starColor
      x
      y
    }
  }
`;

export const ON_LETTER_CREATED = `
  subscription OnLetterCreated {
    onCreateLetter {
      id
      senderId
      recipientId
      type
      createdAt
    }
  }
`;

export const ON_CONNECTION_CREATED = `
  subscription OnConnectionCreated {
    onCreateConnection {
      id
      userAId
      userBId
      letterCount
      createdAt
      updatedAt
    }
  }
`;

export const ON_CONNECTION_UPDATED = `
  subscription OnConnectionUpdated {
    onUpdateConnection {
      id
      userAId
      userBId
      letterCount
      createdAt
      updatedAt
    }
  }
`;

export const ON_EVENT_UPDATED = `
  subscription OnEventUpdated {
    onUpdateEvent {
      id
      status
      startedAt
      finishedAt
    }
  }
`;