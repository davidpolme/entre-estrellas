export const GET_EVENT = `
  query GetEvent {
    getEvent {
      id
      status
      startedAt
      finishedAt
    }
  }
`;

export const LIST_USERS = `
  query ListUsers {
    listUsers {
      id
      username
      starColor
      x
      y
    }
  }
`;

export const GET_MY_PROFILE = `
  query GetMyProfile {
    getMyProfile {
      id
      username
      starColor
      x
      y
      communityLetterCompleted
      createdAt
    }
  }
`;

export const GET_MY_CONNECTIONS = `
  query GetMyConnections {
    getMyConnections {
      id
      userAId
      userBId
      letterCount
      createdAt
      updatedAt
    }
  }
`;

export const GET_MY_LETTERS = `
  query GetMyLetters {
    getMyLetters {
      id
      senderId
      recipientId
      type
      content
      createdAt
      readAt
      senderName
    }
  }
`;

export const GET_MY_ASSIGNMENT = `
  query GetMyAssignment {
    getMyAssignment {
      senderId
      recipientId
      completed
      createdAt
      completedAt
    }
  }
`;

export const GET_ADMIN_STATS = `
  query GetAdminStats {
    getAdminStats {
      totalParticipants
      colorDistribution
      eventStatus
      communityLettersSent
      totalLetters
      totalConnections
    }
  }
`;

export const REGISTER_USER = `
  mutation RegisterUser($input: RegisterUserInput!) {
    registerUser(input: $input) {
      id
      username
      starColor
      x
      y
      communityLetterCompleted
      createdAt
    }
  }
`;

export const SEND_COMMUNITY_LETTER = `
  mutation SendCommunityLetter($content: String!) {
    sendCommunityLetter(content: $content) {
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
  mutation SendDirectLetter($recipientId: ID!, $content: String!) {
    sendDirectLetter(recipientId: $recipientId, content: $content) {
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
  mutation StartEvent {
    startEvent {
      id
      status
      startedAt
      finishedAt
    }
  }
`;

export const FINISH_EVENT = `
  mutation FinishEvent {
    finishEvent {
      id
      status
      startedAt
      finishedAt
    }
  }
`;

export const MARK_LETTER_READ = `
  mutation MarkLetterRead($letterId: ID!) {
    markLetterRead(letterId: $letterId) {
      id
      readAt
    }
  }
`;

export const ON_USER_JOINED = `
  subscription OnUserJoined {
    onUserJoined {
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
    onLetterCreated {
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
    onConnectionCreated {
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
    onConnectionUpdated {
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
    onEventUpdated {
      id
      status
      startedAt
      finishedAt
    }
  }
`;