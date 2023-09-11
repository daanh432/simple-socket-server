import { Socket } from 'socket.io';
import { SubscriptionManager } from './subscriptions';

export class SocketConnection {
  private socket: Socket;
  private user: unknown | undefined;

  constructor(socket: Socket) {
    this.socket = socket;
  }

  public get id(): string {
    return this.socket.id;
  }

  public setUser(user: unknown) {
    this.user = user;
  }

  public getUser(): unknown {
    return this.user;
  }

  public emit<T>(topic: string, args: T) {
    this.socket.emit(topic, args);
  }
}

export class ConnectionManager {
  private static instance: ConnectionManager = new ConnectionManager();

  public static getInstance(): ConnectionManager {
    return this.instance;
  }

  private connections: Map<string, SocketConnection> = new Map();

  private getConnection(socket: Socket): SocketConnection {
    if (!this.connections.has(socket.id)) {
      this.connections.set(socket.id, new SocketConnection(socket));
    }

    return this.connections.get(socket.id)!;
  }

  public onOpen(socket: Socket): SocketConnection {
    return this.getConnection(socket);
  }

  public async onClose(socket: Socket): Promise<void> {
    const socketConnection = this.getConnection(socket);
    await SubscriptionManager.getInstance().deregisterAll(socketConnection);
    this.connections.delete(socket.id);
  }
}
