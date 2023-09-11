import { AuthenticationManager } from './authentication';
import { SocketConnection } from './connections';
import { SubscriptionManager } from './subscriptions';

export interface SubscribeEvent {
  topic: string;
}

export const subscribeHandler = async (socket: SocketConnection, e: SubscribeEvent): Promise<void> => {
  console.debug(`Subscribe request from ${socket.id} for ${e.topic}`);

  const canSubscribe = await AuthenticationManager.getInstance().canSubscribe(e.topic, socket);
  console.debug(`Subscribe request from ${socket.id} for ${e.topic} is ${canSubscribe ? 'allowed' : 'denied'}`);
  if (canSubscribe) {
    SubscriptionManager.getInstance().register(e.topic, socket);
  }
};

export const unsubscribeHandler = async (socket: SocketConnection, e: SubscribeEvent): Promise<void> => {
  console.debug(`Subscribe request from ${socket.id} for ${e.topic}`);

  SubscriptionManager.getInstance().deregister(e.topic, socket);
};
