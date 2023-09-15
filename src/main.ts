import { Server } from 'socket.io';
import express from 'express';
import { createServer } from 'node:http';
import { resolve } from 'node:path';
import { subscribeHandler, unsubscribeHandler } from './subscribe';
import { emitHandler } from './emit';
import { configureLogging } from './logging';
import { ConnectionManager } from './connections';
import { testRuleSystem } from './runtime-tests';
import { AuthenticationManager } from './authentication';

// @ts-ignore
global.logLevel = process.env.LOG_LEVEL ?? 'info';
const port = process.env.SOCKET_PORT ?? 3000;
const path = process.env.SOCKET_PATH ?? '/socket.io/';

configureLogging();
testRuleSystem();

export class SocketServer {
  private static instance: SocketServer = new SocketServer();

  private readonly app = express();
  private readonly server = createServer(this.app);
  public readonly io = new Server(this.server, {
    path: path,
    cleanupEmptyChildNamespaces: true,
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    }
  });

  public static getInstance(): SocketServer {
    return this.instance;
  }

  constructor() {
    // If development mode, serve the static index file
    if (process.env.NODE_ENV == undefined || process.env.NODE_ENV === 'development') {
      this.app.get('/', (req, res) => {
        res.sendFile(resolve(__dirname, '../', 'index.html'));
      });
    }

    this.server.listen(port, () => {
      console.log(`Socket.io running at http://localhost:${port}${path}`);
    });

    this.io.use(async (socket, next) => {
      // If the user is already authenticated, allow the packet to be sent
      const socketConnection = ConnectionManager.getInstance().onOpen(socket);
      if (socketConnection.getUser() !== undefined) {
        return next();
      }

      const authData = socket.handshake.auth;
      if (authData === undefined) {
        return next(new Error('Authentication data not provided'));
      }

      const loggedIn = await AuthenticationManager.getInstance().authenticate(authData, socketConnection);
      if (!loggedIn) {
        return next(new Error('Authentication failed'));
      }

      return next();
    });

    this.io.on('connection', (socket) => {
      const socketConnection = ConnectionManager.getInstance().onOpen(socket);
      socket.on('disconnect', async () => {
        ConnectionManager.getInstance().onClose(socket);
      });

      socket.on('subscribe', (e) => subscribeHandler(socketConnection, e));
      socket.on('unsubscribe', (e) => unsubscribeHandler(socketConnection, e));
      socket.on('emit', (e) => emitHandler(socketConnection, e));
    });
  }
}
