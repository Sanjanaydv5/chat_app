import React, { useState, useRef, useEffect } from "react";
import { useThemeStore } from "../../stores/themeStore";
import { useUserStore } from "../../stores/userStore";
import { useChatStore } from "../../stores/chatStore";
import { set } from "mongoose";

const isValidate = (date) => {
    return date instanceof Date && !isNaN(date);
}
const ChatWindow = ({ selectedContact, setSelectedContact }) => {
    const [message, setMessage] = useState("");
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showFileMenu, setShowFileMenu] = useState(false);
    const [filePreview, setFilePreview] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const typingTimeoutRef = useRef(null);
    const messageEndRef = useRef(null);
    const emojiPickerRef = useRef(null);
    const fileInputRef = useRef(null);

    const { theme } = useThemeStore();
    const { user } = useUserStore();

    const { messages, loading, sendMessage, receiveMessage, fetchMessages, fetchConversations, conversations, isUserTyping, startTyping, stopTyping, getUserLastSeen, isUserOnline, cleanup, addReaction, deleteMessage } = useChatStore();
    //get online status of user and last seen
    const online = isUserOnline(selectedContact?._id);
    const lastSeen = getUserLastSeen(selectedContact?._id);
    const isTyping = isUserTyping(selectedContact?._id);

    useEffect(() => {
        if (selectedContact?._id && conversations?.data?.length > 0) {
            const conversation = conversations?.data?.find((conv) =>
                conv.participants.some((participant) => participant._id === selectedContact?._id ))
            if(conversation._id){
                fetchMessages(conversation._id)
            }
        }
    }, [selectedContact,conversations])

    useEffect(() => {
        fetchConversations();
    },[]);

    const scrollToBottom =() => {
        messageEndRef.current?.scrollIntoView({behavior:"auto"})
    }

    useEffect(() => {
        scrollToBottom();
    },[messages])

    useEffect(() => {
        if(message && selectedContact) {
            startTyping(selectedContact?._id);

            if(typingTimeoutRef.current){
                clearTimeout(typingTimeoutRef.current)
            }
            typingTimeoutRef.current = setTimeout(() => {
                stopTyping(selectedContact?._id)
            },2000);
        }
        return () => {
            if(typingTimeoutRef.current){
                clearTimeout(typingTimeoutRef.current)
            }
        }
    },{message,selectedContact,startTyping,stopTyping})

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if(file){
            setSelectedFile(file);
            setShowFileMenu(false);
            if(file.type.startsWith('image/')){
                setFilePreview(URL.createObjectURL(file))
            }
        }
    }

    const handleSendMessage = async() => {
        if(!selectedContact) return;
        setFilePreview(null);
        try{
            const formData = new FormData();
            formData.append("senderId",user?._id)
            formData.append("receiverId",selectedContact?._id)

            const status = online ? "delivered" : "send";
            formData.append("messageStatus",status);
            if(message.trim()){
                formData.append("content",message.trim());
            }
            //if there is file include that too
            if(selectedFile){
                formData.append("media",selectedFile,selectedFile.name)
            }
            if(!message.trim() && !selectedFile) return;
            await sendMessage(formData);
            //clear state
            setMessage("");
            setFilePreview(null);
            setSelectedContact(null);
            setShowFileMenu(false);
        } catch (error){
            console.error("failed to send message",error)
        }
    }

return (
    <div>
        <h1>Welcome to the ChatWindow</h1>
    </div>
);
}
export default ChatWindow;