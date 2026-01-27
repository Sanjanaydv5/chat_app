import {io} from "socket.io-client";
import useUserStore from "../../store/useUserStore";


let socket = null;


export const initializeSocket = () => {
    if (socket) return socket;

    const user = useUserStore.getState().user;
    const BACKEND_URL = process.env.REACT_APP_API_URL || "http://localhost:3000";

    socket = io(BACKEND_URL, {
        withCredentials: true,
        trasports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
    });


    // Handle connection event
    socket.on("connect", () => {
        console.log("Connected to chat server", socket.id);
        if (user && user.id) {
            socket.emit("join", {userId: user.id});
        }
    });


    // Handle connection error event
    socket.on("connect_error", (error) => {
        console.error("Connection error:", error);
    });

    // Handle disconnection event
    socket.on("disconnect", (reason) => {
        console.log("Disconnected from chat server:", reason);
    });

    return socket;
};

export const getSocket = () => {
    if (!socket) {
        return initializeSocket();
    }
    return socket;
}

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};