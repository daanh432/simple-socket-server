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
const port = process.env.PORT ?? 3000;
const path = process.env.PATH ?? '/socket.io/';

configureLogging();
testRuleSystem();

export class SocketServer {
  private static instance: SocketServer = new SocketServer();

  private readonly app = express();
  private readonly server = createServer(this.app);
  public readonly io = new Server(this.server, {
    path: path,
    cleanupEmptyChildNamespaces: true,
  });

  public static getInstance(): SocketServer {
    return this.instance;
  }

  constructor() {
    // If development mode, serve the static index file
    if (process.env.NODE_ENV === 'development') {
      this.app.get('/', (req, res) => {
        res.sendFile(resolve(__dirname, '../', 'index.html'));
      });
    }

    this.server.listen(port, () => {
      console.log(`Socket.io running at http://localhost:${port}${path}`);
    });

    this.io.on('connection', (socket) => {
      const socketConnection = ConnectionManager.getInstance().onOpen(socket);
      socket.on('disconnect', async () => {
        ConnectionManager.getInstance().onClose(socket);
      });

      socket.emit('auth', { auth: 'required' });
      socket.on('auth', async (e) => {
        const loggedIn = await AuthenticationManager.getInstance().authenticate(e, socketConnection);
        if (loggedIn) {
          socket.emit('auth', { auth: 'success' });
        }
      });

      socket.on('subscribe', (e) => subscribeHandler(socketConnection, e));
      socket.on('unsubscribe', (e) => unsubscribeHandler(socketConnection, e));
      socket.on('emit', (e) => emitHandler(socketConnection, e));
    });
  }
}
