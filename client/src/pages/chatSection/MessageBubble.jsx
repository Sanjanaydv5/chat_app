import React, { useState, useRef } from 'react';
import { format } from 'date-fns';
import {
  FaCheck,
  FaCheckDouble,
  FaPlus,
  FaRegCopy,
  FaSmile,
  FaTrashAlt,
  FaChevronDown
} from 'react-icons/fa';
import { RxCross2 } from 'react-icons/rx';
import EmojiPicker from 'emoji-picker-react';
import useOutSideClick from '../../hooks/useOutSideClick';

const MessageBubble = ({ message, theme, onReact, currentUser, deleteMessage }) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const optionRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const reactionsMenuRef = useRef(null);

  const isUserMessage = message.sender?._id === currentUser?._id;
  const isDark = theme === "dark";

  const bubbleBg = isUserMessage
    ? (isDark ? "bg-[#005c4b]" : "bg-[#d9fdd3]")
    : (isDark ? "bg-[#202c33]" : "bg-white");

  const textColor = isDark ? "text-[#e9edef]" : "text-[#111b21]";
  const quickReactions = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

  const closeAllPopups = () => {
    setShowOptions(false);
    setShowReactions(false);
    setShowEmojiPicker(false);
  };

  const handleReact = (emoji) => {
    onReact(message._id, emoji);
    closeAllPopups();
  };

  useOutSideClick(optionRef, closeAllPopups);
  useOutSideClick(reactionsMenuRef, () => setShowReactions(false));
  useOutSideClick(emojiPickerRef, () => setShowEmojiPicker(false));

  if (!message) return null;

  // Group reactions (WhatsApp style)
  const groupedReactions = Object.values(
    (message.reactions || []).reduce((acc, r) => {
      acc[r.emoji] = acc[r.emoji]
        ? { ...acc[r.emoji], count: acc[r.emoji].count + 1 }
        : { emoji: r.emoji, count: 1 };
      return acc;
    }, {})
  );

  return (
    <div className={`flex w-full mb-1 px-[5%] ${isUserMessage ? "justify-end" : "justify-start"}`}>
      <div className="relative group max-w-[85%] md:max-w-[65%] lg:max-w-[50%]">

        {/* Quick Reactions Popup */}
        {showReactions && (
          <div
            ref={reactionsMenuRef}
            className={`absolute -top-12 ${isUserMessage ? "right-0" : "left-0"}
            flex items-center gap-1 px-2 py-1 rounded-full shadow-xl z-50
            ${isDark ? "bg-[#233138]" : "bg-white"}`}
          >
            {quickReactions.map((emoji, i) => (
              <button
                key={i}
                onClick={() => handleReact(emoji)}
                className="text-xl hover:scale-150 transition-transform p-1"
              >
                {emoji}
              </button>
            ))}
            <button
              onClick={() => {
                setShowEmojiPicker(true);
                setShowReactions(false);
              }}
              className="p-2 rounded-full hover:bg-black/10 text-gray-400"
            >
              <FaPlus size={12} />
            </button>
          </div>
        )}

        {/* Message Bubble */}
        <div className={`${bubbleBg} ${textColor} rounded-lg shadow-sm relative pl-3 pr-2 py-1.5 min-w-[80px]`}>

          {/* Chevron Options */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              closeAllPopups();
              setShowOptions(true);
            }}
            className="absolute top-1 right-1  text-gray-500 hover:text-gray-700"
          >
            <FaChevronDown size={14} />
          </button>

          {/* Smile Reaction Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              closeAllPopups();
              setShowReactions(true);
            }}
            className={`absolute top-1/2 -translate-y-1/2
              ${isUserMessage ? "-left-7" : "-right-7"}`}
          >
            <FaSmile size={16} className="text-gray-500" />
          </button>

          {/* Content */}
          {message.contentType === "image" && message.mediaUrl && (
            <img
              src={message.mediaUrl}
              alt="media"
              className="rounded-md mb-1 max-h-60 object-cover w-full"
            />
          )}

          {message.contentType === "video" && message.mediaUrl && (
            <video controls src={message.mediaUrl} className="rounded-md mb-1 max-h-60 w-full" />
          )}

          {message.contentType === "audio" && message.mediaUrl && (
            <audio controls src={message.mediaUrl} className="w-full mb-1" />
          )}

          {message.contentType === "file" && message.mediaUrl && (
            <div className="p-2 mb-1 bg-gray-100 rounded">
              <a href={message.mediaUrl} target="_blank" rel="noreferrer" className="text-blue-500 underline">
                {message.fileName || 'Download attachment'}
              </a>
            </div>
          )}

          {message.contentType === "sticker" && message.content && (
            <div className="text-3xl mb-1">{message.content}</div>
          )}

          {message.contentType !== 'sticker' && message.contentType !== 'image' && message.contentType !== 'video' && message.contentType !== 'audio' && message.contentType !== 'file' && message.content && (
            <p className="text-[14.2px] leading-tight break-words whitespace-pre-wrap">
              {message.content}
            </p>
          )}

          {message.contentType === 'image' || message.contentType === 'video' || message.contentType === 'audio' || message.contentType === 'file' ? (
            message.content ? (
              <p className="text-[14.2px] leading-tight break-words whitespace-pre-wrap mt-1">{message.content}</p>
            ) : null
          ) : null}

          {/* Footer */}
          <div className="flex items-center justify-end gap-1 mt-0.5 h-4 select-none">
            <span className="text-[10px] opacity-50">
              {format(new Date(message.createdAt), "h:mm a")}
            </span>
            {isUserMessage && (
              <>
                {message.messageStatus === "read" ? (
                  <FaCheckDouble size={11} className="text-[#53bdeb]" />
                ) : message.messageStatus === "delivered" ? (
                  <FaCheckDouble size={11} className="opacity-40" />
                ) : (
                  <FaCheck size={11} className="opacity-40" />
                )}
              </>
            )}
          </div>

          {/* Reactions Pill */}
          {groupedReactions.length > 0 && (
            <div
              className={`absolute -bottom-3 ${isUserMessage ? "right-2" : "left-2"}
              flex items-center gap-1 px-2 py-0.5 rounded-full shadow-sm border
              ${isDark ? "bg-[#233138] border-[#0b141a]" : "bg-[#f0f2f5] border-white"}`}
            >
              {groupedReactions.map((r, i) => (
                <span key={i} className="text-[11px]">
                  {r.emoji}{r.count > 1 && r.count}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Options Menu */}
        {showOptions && (
          <div
            ref={optionRef}
            className={`absolute top-7 right-0 z-50 w-36 rounded-sm shadow-2xl py-2
            ${isDark ? "bg-[#233138] text-white" : "bg-white text-black"}`}
          >
            <button
              onClick={() => {
                navigator.clipboard.writeText(message.content);
                closeAllPopups();
              }}
              className="flex items-center gap-4 w-full px-5 py-2.5 text-sm hover:bg-black/10"
            >
              <FaRegCopy size={14} /> Copy
            </button>

            {isUserMessage && (
              <button
                onClick={() => {
                  deleteMessage(message._id);
                  closeAllPopups();
                }}
                className="flex items-center gap-4 w-full px-5 py-2.5 text-sm text-red-500 hover:bg-black/10"
              >
                <FaTrashAlt size={14} /> Delete
              </button>
            )}
          </div>
        )}

        {/* Full Emoji Picker */}
        {showEmojiPicker && (
          <div
            ref={emojiPickerRef}
            className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4"
          >
            <div className="relative">
              <button
                onClick={() => setShowEmojiPicker(false)}
                className="absolute -top-10 right-0 text-white"
              >
                <RxCross2 size={26} />
              </button>
              <EmojiPicker
                onEmojiClick={(obj) => handleReact(obj.emoji)}
                theme={isDark ? "dark" : "light"}
              />
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default MessageBubble;
