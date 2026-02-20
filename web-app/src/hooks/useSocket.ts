import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export const useSocket = () => {
    const [socket, setSocket] = useState<Socket | null>(null);

    useEffect(() => {
        const socketInstance = io("http://localhost:3001", {
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
