import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export const useSocket = () => {
    const [socket, setSocket] = useState<Socket | null>(null);

    useEffect(() => {
        const socketUrl = typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:3001` : "http://localhost:3001";
        const socketInstance = io(socketUrl, {
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
