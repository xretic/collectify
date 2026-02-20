import type { Server as HttpServer } from 'http';
import type { Server as IOServer } from 'socket.io';

declare module 'http' {
    interface Server {
        io?: IOServer;
    }
}
