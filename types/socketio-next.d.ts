import type { Server as IOServer } from 'socket.io';
import type { Server as HttpServer } from 'http';
import type { Socket } from 'net';

declare module 'net' {
    interface Socket {
        server: HttpServer & {
            io?: IOServer;
        };
    }
}

export {};
