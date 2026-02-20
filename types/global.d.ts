import { Server } from 'socket.io';

declare global {
    var _io: Server | undefined;
}

export {};
