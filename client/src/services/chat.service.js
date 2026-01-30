import {io} from "socket.io-client";
import useUserStore from "../store/useUserStore";


let socket = null;


export const initializeSocket = () => {
    if (socket) return socket;

    const BACKEND_URL = process.env.REACT_APP_API_URL || "http://localhost:3000";

   socket = io(BACKEND_URL, {
    withCredentials: true,
    transports: ['websocket', 'polling'], // FIXED: spelling
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
});



    // Handle connection event
    socket.on("connect", () => {
        console.log("Connected to chat server", socket.id);
        const currentUser = useUserStore.getState().user;
        if (currentUser && currentUser._id) {
            console.log("Emitting user_connected for user:", currentUser._id);
            socket.emit("user_connected", currentUser._id);
        } else {
            console.error("Cannot emit user_connected: user not found");
        }
    });

    // Handle reconnection
    socket.on("reconnect", () => {
        console.log("Reconnected to chat server", socket.id);
        const currentUser = useUserStore.getState().user;
        if (currentUser && currentUser._id) {
            console.log("Emitting user_connected after reconnect:", currentUser._id);
            socket.emit("user_connected", currentUser._id);
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