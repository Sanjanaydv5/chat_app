import React, { useState, useRef, useEffect } from "react";
import useThemeStore from "../../store/themeStore";
import useUserStore from "../../store/useUserStore";
import { useChatStore } from "../../store/chatStore";
import { isToday, isYesterday, format } from 'date-fns';
import whatsappImage from '../../images/whatsapp_image.png'
// Import from the 'fa' (Font Awesome) sub-directory
import { FaArrowLeft, FaEllipsisV, FaFile, FaImage, FaLock, FaPaperclip, FaPaperPlane, FaSmile, FaTimes, FaVideo, FaPlus } from 'react-icons/fa';
import MessageBubble from "./MessageBubble";
import EmojiPicker from 'emoji-picker-react';
import VideoCall from "./VideoCall";

const isValidate = (date) => {
    return date instanceof Date && !isNaN(date);
}
const ChatWindow = ({ selectedContact, setSelectedContact }) => {
    const [message, setMessage] = useState("");
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showFileMenu, setShowFileMenu] = useState(false);
    const [filePreview, setFilePreview] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [recording, setRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState(null);
    const [audioURL, setAudioURL] = useState(null);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const [stickersOpen, setStickersOpen] = useState(false);
    const [selectedSticker, setSelectedSticker] = useState(null);
    const [stickerSet] = useState([
        "😀", "😂", "😍", "😎", "🥳", "👍", "🎉", "💬"
    ]);
    const typingTimeoutRef = useRef(null);
    const messageEndRef = useRef(null);
    const emojiPickerRef = useRef(null);
    const fileInputRef = useRef(null);

    const { theme } = useThemeStore();
    const { user, isAuthenticated } = useUserStore();
    
    useEffect(() => {
        console.log("ChatWindow: user=", user, "isAuthenticated=", isAuthenticated);
    }, [user, isAuthenticated]);

    const { messages, sendMessage, fetchMessages, fetchConversations, conversations, isUserTyping, startTyping,
         stopTyping, getUserLastSeen, addReaction, deleteMessage, isUserOnline, initiateCall } = useChatStore();
    //get online status of user and last seen
    const online = isUserOnline(selectedContact?._id);
    const lastSeen = getUserLastSeen(selectedContact?._id);
    const isTyping = isUserTyping(selectedContact?._id);


    useEffect(() => {
        console.log("ChatWindow: selectedContact changed:", selectedContact?._id);
        console.log("ChatWindow: conversations:", conversations);
        if (selectedContact?._id && conversations?.data?.length > 0) {
            const conversation = conversations?.data?.find((conv) =>
                conv.participants.some((participant) => participant._id === selectedContact?._id));
            console.log("ChatWindow: Found conversation:", conversation);
            if (conversation?._id) {
                console.log("ChatWindow: Calling fetchMessages for:", conversation._id);
                fetchMessages(conversation._id);
            } else {
                console.log("ChatWindow: No conversation found for this contact");
            }
        } else {
            console.log("ChatWindow: No selectedContact or conversations not loaded yet");
        }
    }, [selectedContact, conversations, fetchMessages])

    useEffect(() => {
        fetchConversations();
    }, [fetchConversations]);

    const scrollToBottom = () => {
        messageEndRef.current?.scrollIntoView({ behavior: "auto" })
    }

    useEffect(() => {
        scrollToBottom();
    }, [messages])

    useEffect(() => {
        if (message && selectedContact) {
            startTyping(selectedContact?._id);

            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current)
            }
            typingTimeoutRef.current = setTimeout(() => {
                stopTyping(selectedContact?._id)
            }, 2000);
        }
        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current)
            }
        }
    }, [message, selectedContact, startTyping, stopTyping])

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setAudioBlob(null);
            setAudioURL(null);
            setSelectedSticker(null);
            setShowFileMenu(false);
            if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
                setFilePreview(URL.createObjectURL(file))
            } else if (file.type.startsWith('audio/')) {
                setAudioURL(URL.createObjectURL(file));
            } else {
                setFilePreview(null);
            }
        }
    }

    const startVoiceRecording = async () => {
        if (!navigator.mediaDevices?.getUserMedia) {
            alert('Voice recording is not supported by your browser.');
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            const chunks = [];

            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunks.push(event.data);
                }
            };

            recorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'audio/webm' });
                const url = URL.createObjectURL(blob);
                setAudioBlob(blob);
                setAudioURL(url);
                setRecording(false);
            };

            recorder.start();
            setMediaRecorder(recorder);
            setRecording(true);
            setSelectedFile(null);
            setSelectedSticker(null);
            setFilePreview(null);
        } catch (error) {
            console.error('Voice recording error:', error);
            alert('Unable to start voice recording. Check microphone permission.');
        }
    }

    const stopVoiceRecording = () => {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
        }
    }

    const cancelVoiceNote = () => {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
        }
        setRecording(false);
        setAudioBlob(null);
        setAudioURL(null);
    }

    const handleSendMessage = async () => {
        console.log("handleSendMessage called");
        console.log("selectedContact:", selectedContact);
        console.log("user:", user);
        console.log("message:", message);
        console.log("selectedFile:", selectedFile);
        
        if (!selectedContact) {
            console.error("No selected contact");
            return;
        }
        
        // Validate user and contact IDs before proceeding
        if (!user?._id) {
            console.error("User ID is not available", user);
            return;
        }
        
        if (!selectedContact?._id) {
            console.error("Selected contact ID is not available", selectedContact);
            return;
        }
        
        setFilePreview(null);
        console.log("Sending message to:", selectedContact._id, "from:", user._id);
        try {
            const formData = new FormData();

            formData.append("senderId", user._id);
            formData.append("receiverId", selectedContact._id);

            const status = online ? "delivered" : "sent";
            formData.append("messageStatus", status);

            let finalContent = message.trim();
            let finalContentType = "text";

            if (selectedSticker) {
                finalContent = selectedSticker;
                finalContentType = "sticker";
            }

            if (audioBlob) {
                finalContentType = "audio";
                const voiceFile = new File([audioBlob], `voice-${Date.now()}.webm`, { type: "audio/webm" });
                formData.append("media", voiceFile, voiceFile.name);
            } else if (selectedFile) {
                formData.append("media", selectedFile, selectedFile.name);

                if (selectedFile.type.startsWith("image/")) finalContentType = "image";
                else if (selectedFile.type.startsWith("video/")) finalContentType = "video";
                else if (selectedFile.type.startsWith("audio/")) finalContentType = "audio";
                else finalContentType = "file";
            }

            if (finalContent) {
                formData.append("content", finalContent);
            }

            formData.append("contentType", finalContentType);

            if (!finalContent && !selectedFile && !audioBlob && !selectedSticker) {
                console.error("No message content or media to send");
                return;
            }

            console.log("Calling sendMessage function...");
            const sentMessage = await sendMessage(formData);
            console.log("Message sent successfully:", sentMessage);

            // Refetch conversations and messages to persist server copy of media links
            await fetchConversations();
            if (sentMessage?.conversation) {
                await fetchMessages(sentMessage.conversation);
            }

            //clear input state after successful send
            setMessage("");
            setSelectedSticker(null);
            setAudioBlob(null);
            setAudioURL(null);
            setSelectedFile(null);
            setFilePreview(null);
            setShowFileMenu(false);
            setRecording(false);

            if (mediaRecorder && mediaRecorder.state !== "inactive") {
                mediaRecorder.stop();
            }

        } catch (error) {
            console.error("failed to send message", error);
        }
    }

    const renderDateSeparator = (date) => {
        if (!isValidate(date)) {
            return null;
        }
        let dateString;
        if (isToday(date)) {
            dateString = "Today"
        } else if (isYesterday(date)) {
            dateString = "Yesterday"
        } else {
            dateString = format(date, "EEEE,MMM,d")
        }

        return (
            <div className="flex justify-center my-4">
                <span className={`px-4 py-2 rounded-full text-sm ${theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'}`}>
                    {dateString}
                </span>
            </div>
        )
    }
    // Group message
    const groupMessages = Array.isArray(messages) ? messages.reduce((acc, message) => {
        if (!message.createdAt) return acc;
        const date = new Date(message.createdAt);
        if (isValidate(date)) {
            const dateString = format(date, "yyyy-MM-dd");
            if (!acc[dateString]) {
                acc[dateString] = [];
            }
            acc[dateString].push(message);
        } else {
            console.error("Invalid date for message", message)
        }
        return acc;
    }, {}) : {};

    const handleReaction = (messageId, emoji) => {
        addReaction(messageId, emoji)
        console.log(messageId,emoji)
    }

    if (!selectedContact) {
        return (
            <div className="flex-1 flex flex-col items-center justufy-center mx-auto h-screen text-center">
                <div className="max-w-md">
                    <img src={whatsappImage} alt="chat_app"
                        className="w-full h-auto" />
                    <h2 className={`text-3xl font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                        select a conversation to start chatting
                    </h2>
                    <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}mb-2`}>
                        Choose a contact from the list
                    </p>
                    <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-sm mt-2 flex items-center justify-center gap-2 `}>
                        <FaLock className="h-4 w-4" />
                        Your personal messages are end-to-end encrypted
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex-1 h-screen w-full flex flex-col">
            <div className={`px-4 py-0 ${theme === 'dark' ? 'bg-[#303430] text-white' : 'bg-[rgb(239,242,245)] text-gray-600'} flex items-center `}>
                <button className="mr-2 focus:outline-none"
                    onClick={() => setSelectedContact(null)}>
                    <FaArrowLeft className="h-4 w-4" />
                </button>
                <img src={selectedContact?.profilePicture}
                    alt={selectedContact?.username}
                    className="w-10 h-10 rounded-full" />
                <div className="ml-3 flex-grow">
                    <h2 className="font-semibold text-start text-2xl mt-1">
                        {selectedContact?.username}
                    </h2>
                    {isTyping ? (
                        <div>Typing...</div>
                    ) : (
                        <p className={`text-sm ${theme === 'dark' ? "text-gray-400" : "text-gray-500"}`}>
                            {online ? "Online" : lastSeen ? `Last Seen ${format(new Date (lastSeen), "HH:mm")}` : "Offline"}
                        </p>
                    )}
                </div>
                <div className="flex items-center space-x-4">
                    <button 
                        className="focus:outline-none hover:text-green-500 transition-colors"
                        onClick={() => initiateCall(selectedContact._id)}
                    >
                        <FaVideo className="h-5 w-5" />
                    </button>
                    <button className="focus:outline-none">
                        <FaEllipsisV className="h-5 w-5" />
                    </button>
                </div>
            </div>
            <div className={`flex-1 p-4 overflow-y-auto ${theme === 'dark' ? 'bg-[#191a1a]' : 'bg-[rgb(241,236,229)]'}`}>
                {Object.entries(groupMessages).map(([date, msgs]) => (
                    <React.Fragment key={date}>
                        {renderDateSeparator(new Date(date))}
                        {msgs.map((msg) => (
                            <MessageBubble
                                key={msg._id || msg.tempId}
                                message={msg}
                                theme={theme}
                                currentUser={user}
                                onReact={handleReaction}
                                deleteMessage={deleteMessage}
                            />
                        ))}
                    </React.Fragment>
                ))}
                <div ref={messageEndRef} />
            </div>
            {filePreview && selectedFile && selectedFile.type.startsWith('image/') && (
                <div className="relative p-2">
                    <img src={filePreview}
                        alt="file-preview"
                        className="w-full object-cover rounded shadow-lg mx-auto max-h-72" />
                    <button
                        onClick={() => {
                            setSelectedFile(null);
                            setFilePreview(null);
                        }}
                        className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1"
                    >
                        <FaTimes className="h-4 w-4" />
                    </button>
                </div>
            )}
            {filePreview && selectedFile && selectedFile.type.startsWith('video/') && (
                <div className="relative p-2">
                    <video controls src={filePreview} className="w-full rounded shadow-lg mx-auto max-h-72" />
                    <button
                        onClick={() => {
                            setSelectedFile(null);
                            setFilePreview(null);
                        }}
                        className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1"
                    >
                        <FaTimes className="h-4 w-4" />
                    </button>
                </div>
            )}
            {audioURL && (
                <div className="relative p-2">
                    <audio controls src={audioURL} className="w-full" />
                    <button
                        onClick={() => {
                            setAudioBlob(null);
                            setAudioURL(null);
                        }}
                        className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1"
                    >
                        <FaTimes className="h-4 w-4" />
                    </button>
                </div>
            )}
            {selectedFile && !selectedFile.type.startsWith('image/') && !selectedFile.type.startsWith('video/') && !selectedFile.type.startsWith('audio/') && (
                <div className="relative p-2 border rounded bg-gray-50 dark:bg-gray-800">
                    <p className="truncate">Attached file: {selectedFile.name}</p>
                    <button
                        onClick={() => {
                            setSelectedFile(null);
                            setFilePreview(null);
                        }}
                        className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1"
                    >
                        <FaTimes className="h-4 w-4" />
                    </button>
                </div>
            )}

            {selectedSticker && (
                <div className="relative p-2 border rounded bg-gray-50 dark:bg-gray-800">
                    <p className="text-lg">Selected sticker: {selectedSticker}</p>
                    <button
                        onClick={() => setSelectedSticker(null)}
                        className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1"
                    >
                        <FaTimes className="h-4 w-4" />
                    </button>
                </div>
            )}
            <div className={`p-4 ${theme === 'dark' ? "bg-[#303430]" : "bg-white"} flex items-center space-x-2 relative`}>
                <button
                    className="focus:outline-none"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
                    <FaSmile className={`h-6 w-6 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}/>
                </button>

                <button
                    className="focus:outline-none"
                    onClick={() => setStickersOpen((prev) => !prev)}>
                    <FaPlus className={`h-6 w-6 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`} />
                </button>

                <button
                    className={`focus:outline-none ${recording ? 'text-red-400' : ''}`}
                    onClick={() => (recording ? stopVoiceRecording() : startVoiceRecording())}>
                    {recording ? 'Stop' : 'Voice'}
                </button>

                {showEmojiPicker && (
                    <div ref={emojiPickerRef} className="absolute left-0 bottom-36 z-50">
                        <EmojiPicker
                            onEmojiClick={(emojiObject) => {
                                setMessage((prev) => prev + emojiObject.emoji);
                                setShowEmojiPicker(false);
                            }}
                            theme={theme}
                        />
                    </div>
                )}

                {stickersOpen && (
                    <div className="absolute left-12 bottom-36 z-50 bg-white rounded-lg shadow-lg p-2 w-64">
                        <div className="grid grid-cols-4 gap-2">
                            {stickerSet.map((sticker) => (
                                <button
                                    key={sticker}
                                    onClick={() => {
                                        setSelectedSticker(sticker);
                                        setShowEmojiPicker(false);
                                        setStickersOpen(false);
                                        setSelectedFile(null);
                                        setAudioBlob(null);
                                        setAudioURL(null);
                                    }}
                                    className="p-2 text-xl hover:bg-gray-100 rounded"
                                >
                                    {sticker}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="relative">
                    <button className="focus:outline-none"
                        onClick={() => setShowFileMenu(!showFileMenu)}>
                        <FaPaperclip className={`h-6 w-6 ${theme === "dark" ? "text-gray-400" : "text-gray-500"} mt-2`}/>
                    </button>
                    {showFileMenu && (
                        <div className={`absolute bottom-full left-0 mb-2 ${theme === "dark" ? "bg-gray-700" : "bg-white"} rounded-lg shadow-lg`}>
                            <input type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept="image/*,video/*,audio/*,*/*"
                                className="hidden" />
                            <button onClick={() => fileInputRef.current.click()}
                                className={`flex items-center px-4 py-2 w-full transition-colors hover:bg-gray-100 ${theme === "dark" ? "hover:bg-gray-500": "hover:bg-gray-100"}`}>
                                <FaImage className="mr-2"/> Image/Video
                            </button>
                            <button onClick={() => fileInputRef.current.click()}
                                className={`flex items-center px-4 py-2 w-full transition-colors hover:bg-gray-100 ${theme === "dark" ? "hover:bg-gray-500": "hover:bg-gray-100"}`}>
                                <FaFile className="mr-2"/> Files
                            </button>
                        </div>
                    )}
                </div>
                <input type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => {
                        if(e.key === "Enter"){
                            handleSendMessage();
                        }
                    }}
                    placeholder="Type a message"
                    className={`flex-grow px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-green-500
                        ${theme === "dark" ? "bg-gray-700 text-white border-gray-600" : "bg-white text-black border-gray-300"}`} />
                <button onClick={handleSendMessage} className="focus:outline-none">
                    <FaPaperPlane className="h-6 w-6 text-green-500"/>
                </button>
            </div>
            <VideoCall />
        </div>
    );
}
export default ChatWindow;