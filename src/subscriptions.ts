import { SocketConnection } from './connections';

export class Subscription {
  private socket: SocketConnection;

  constructor(socket: SocketConnection) {
    this.socket = socket;
  }

  public getSocket(): SocketConnection {
    return this.socket;
  }
}

export class SubscriptionManager {
  private static instance: SubscriptionManager = new SubscriptionManager();

  public static getInstance(): SubscriptionManager {
    return this.instance;
  }

  private subscriptions: Map<string, Map<string, Subscription>> = new Map();

  public register(topic: string, socket: SocketConnection) {
    if (!this.subscriptions.has(topic)) {
      this.subscriptions.set(topic, new Map());
    }

    const topicSubscriptions = this.subscriptions.get(topic)!;
    if (!topicSubscriptions.has(socket.id)) {
      topicSubscriptions.set(socket.id, new Subscription(socket));
    }
  }

  public deregister(topic: string, socket: SocketConnection) {
    if (this.subscriptions.has(topic)) {
      this.subscriptions.get(topic)?.delete(socket.id);
    }
  }

  public deregisterAll(socket: SocketConnection) {
    return new Promise<void>((resolve) => {
      for (const [topic, topicSubscriptions] of this.subscriptions) {
        if (topicSubscriptions.has(socket.id)) {
          console.debug(`Removing subscription for topic ${topic} for client ${socket.id}`);
          topicSubscriptions.delete(socket.id);
        }
      }
      resolve();
    });
  }

  public sendMessage<T>(topic: string, message: T) {
    return new Promise<void>((resolve) => {
      if (this.subscriptions.has(topic)) {
        const listeners = this.subscriptions.get(topic)!;
        for (const [id, subscription] of listeners) {
          subscription.getSocket().emit(`/sub/-/${topic}`, message);
        }
        resolve();
      }
    });
  }
}
