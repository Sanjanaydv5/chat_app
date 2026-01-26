import React, { useState } from "react";
import { motion } from "framer-motion";
import { FaPlus, FaSearch } from "react-icons/fa";

import useLayoutStore from "../../store/layoutStore";
import useThemeStore from "../../store/themeStore";
import formatTimeStamp from "../../utils/formatTime";

const ChatList = ({ contacts = [] }) => {
  const { setSelectedContact, selectedContact } = useLayoutStore();
  const { theme } = useThemeStore();

  const [searchTerms, setSearchTerms] = useState("");

  const filteredContacts = contacts.filter((contact) =>
    contact?.username?.toLowerCase().includes(searchTerms.toLowerCase())
  );

  return (
    <div
      className={`w-full h-screen border-r
        ${theme === "dark"
          ? "bg-[rgb(17,27,33)] border-gray-600"
          : "bg-white border-gray-200"
        }`}
    >
      {/* Header */}
      <div className={`p-4 flex justify-between items-center
        ${theme === "dark" ? "text-white" : "text-gray-800"}`}
      >
        <h2 className="text-xl font-semibold">Chats</h2>
        <button className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600">
          <FaPlus />
        </button>
      </div>

      {/* Search */}
      <div className="p-2">
        <div className="relative">
          <FaSearch
            className={`absolute left-3 top-1/2 -translate-y-1/2
              ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}
          />
          <input
            type="text"
            placeholder="Search or start new chat"
            value={searchTerms}
            onChange={(e) => setSearchTerms(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 rounded-lg border
              focus:outline-none focus:ring-2 focus:ring-green-500
              ${theme === "dark"
                ? "bg-gray-800 text-white border-gray-700 placeholder-gray-500"
                : "bg-gray-100 text-black border-gray-200 placeholder-gray-400"
              }`}
          />
        </div>
      </div>

      {/* Chat list */}
      <div className="overflow-y-auto h-[calc(100vh-120px)]">
        {filteredContacts.length === 0 && (
          <p className="text-center text-gray-500 mt-6">
            No chats found
          </p>
        )}

        {filteredContacts.map((contact) => {
          const isActive = selectedContact?._id === contact._id;

          return (
            <motion.div
              key={contact._id}
              whileHover={{ scale: 1.01 }}
              onClick={() => setSelectedContact(contact)}
              className={`flex items-center p-3 cursor-pointer transition-colors
                ${theme === "dark"
                  ? isActive
                    ? "bg-gray-700"
                    : "hover:bg-gray-800"
                  : isActive
                  ? "bg-gray-200"
                  : "hover:bg-gray-100"
                }`}
            >
              <img
                src={contact?.profilePicture || "/default-avatar.png"}
                alt={contact?.username}
                className="w-12 h-12 rounded-full object-cover"
              />

              <div className="ml-3 flex-1">
                <div className="flex justify-between">
                  <h2
                    className={`font-semibold
                      ${theme === "dark" ? "text-white" : "text-black"}`}
                  >
                    {contact?.username}
                  </h2>

                  {contact?.conversation?.lastMessage?.createdAt && (
                    <span className="text-xs text-gray-500">
                      {formatTimeStamp(
                        contact.conversation.lastMessage.createdAt
                      )}
                    </span>
                  )}
                </div>

                <div className="flex justify-between items-center">
                  <p
                    className={`text-sm truncate w-3/4
                      ${theme === "dark"
                        ? "text-gray-400"
                        : "text-gray-500"
                      }`}
                  >
                    {contact?.conversation?.lastMessage?.content || "No messages yet"}
                  </p>

                  {contact?.conversation?.unreadCount > 0 && (
                    <span className="bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
                      {contact.conversation.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default ChatList;
