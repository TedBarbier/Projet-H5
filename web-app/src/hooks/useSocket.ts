import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export const useSocket = () => {
    const [socket, setSocket] = useState<Socket | null>(null);

    useEffect(() => {
        const socketUrl = typeof window !== 'undefined' && window.location.hostname !== 'localhost' ? undefined : "http://localhost:3001";
        const socketInstance = io(socketUrl as any, {
            transports: ["websocket"], // force websocket to avoid polling issues with Next.js proxy
        });

        socketInstance.on("connect", () => {
            console.log("Connected to WebSocket Server");
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, []);

    return socket;
};
