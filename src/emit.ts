import { AuthenticationManager } from './authentication';
import { SocketConnection } from './connections';
import { SubscriptionManager } from './subscriptions';

export interface EmitEvent<T> {
  topic: string;
  content: T;
}

export enum MessageType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
}

export interface Message<T> {
  type: MessageType;
  message: T;
}

const invalidData = () => {
  console.debug('Not emitting message, invalid data specified.');
};

export const emitHandler = async (socket: SocketConnection, e: EmitEvent<Message<unknown>>): Promise<void> => {
  // if e is of type string then parse it to json first
  if (typeof e === 'string') {
    try {
      e = JSON.parse(e);
    } catch (error) {
      return invalidData();
    }
  }

  // Validate if all items in the json are present
  if (e.topic == undefined) return invalidData();
  if (e.content == undefined) return invalidData();
  if (e.content.type == undefined) return invalidData();
  if (e.content.message == undefined) return invalidData();

  console.debug(`Emit request from ${socket.id} for ${e.topic}`, e.content);
  const canPublish = await AuthenticationManager.getInstance().canPublish(e.topic, socket);
  console.debug(`Emit request from ${socket.id} for ${e.topic} is ${canPublish ? 'allowed' : 'denied'}`);
  if (canPublish) {
    SubscriptionManager.getInstance().sendMessage(e.topic, e.content);
  }
};
