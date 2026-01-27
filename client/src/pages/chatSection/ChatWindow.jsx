import React, { useState, useRef, useEffect } from "react";
import useThemeStore from "../../store/themeStore";
import useUserStore from "../../store/useUserStore";
import {chatStore} from "../../store/chatStore";
import {isToday,isYesterday,format} from 'date-fns';

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

    const { messages, loading, sendMessage, receiveMessage, fetchMessages, fetchConversations, conversations, isUserTyping, startTyping, stopTyping, getUserLastSeen, isUserOnline, cleanup, addReaction, deleteMessage } = chatStore();
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

    const renderDateSeparator = (date) => {
        if(!isValidate(date)){
            return null;
        }
        let dateString;
        if(isToday(date)){
            dateString="Today"
        } else if (isYesterday(date)){
            dateString = "Yesterday"
        } else {
            dateString = format(date, "EEEE,MMMM,d")
        }

        return(
            <div className="flex justify-center my-4">
                <span className={`px-4 py-2 rounded-full text-sm ${theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'}`}>
            {dateString}
                </span>
            </div>
        )
    }
    // Group message
    const groupMessages = Array.isArray(messages) ? messages.reduce((acc,message) => {
        if(!message.createdAt) return acc;
        const date = new Date(message.createdAt);
        if(isValidate(date)){
            const dateString = format(date, "yyyy-mm-dd");
            if(!acc[dateString]){
                acc[dateString] = [];
            }
            acc[dateString].push(message);
        } else {
            console.error("Invalid date for message",message)
        }
        return acc;
    },{}) : {};

    const handleReaction = (messageId,emoji) => {
        addReaction(messageId,emoji)
    }
    console.log("haha",selectedContact)

    if(!selectedContact){
        return (
            <div className="">
                sacwdc
            </div>
        )
    }

return (
    <div>
        <h1>Welcome to the ChatWindow</h1>
    </div>
);
}
export default ChatWindow;