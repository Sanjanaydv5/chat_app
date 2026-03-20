import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaPlus, FaSearch, FaUserPlus, FaTimes } from "react-icons/fa";

import useLayoutStore from "../../store/layoutStore";
import useThemeStore from "../../store/themeStore";
import useUserStore from "../../store/useUserStore";
import formatTimeStamp from "../../utils/formatTime";
import { addContact } from "../../services/user.service";
import { toast } from "react-toastify";

const ChatList = ({ contacts = [], onContactAdded }) => {
  const setSelectedContact = useLayoutStore((state) => state.setSelectedContact);
  const selectedContact = useLayoutStore((state) => state.selectedContact);
  const { theme } = useThemeStore();
  const { user: currentUser } = useUserStore();

  const [searchTerms, setSearchTerms] = useState("");
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [contactInput, setContactInput] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const handleAddContact = async () => {
    if (!contactInput.trim()) return;
    setIsAdding(true);
    try {
      const result = await addContact(contactInput.trim());
      if (result.status === "success") {
        toast.success(result.message || "Contact added successfully!");
        setContactInput("");
        setIsInviteModalOpen(false);
        if (onContactAdded) onContactAdded();
      } else {
        toast.error(result.message || "Failed to add contact");
      }
    } catch (error) {
      toast.error(error.message || "An error occurred");
    } finally {
      setIsAdding(false);
    }
  };

  const filteredContacts = (contacts || []).filter((contact) =>
    contact?.username?.toLowerCase().includes(searchTerms.toLowerCase()) &&
    contact?._id !== currentUser?._id
  );

  return (
    <div className={`w-full h-screen flex flex-col border-r transition-all duration-300 ${
      theme === "dark" ? "bg-[#111b21] border-gray-700" : "bg-white border-gray-200"
    }`}>
      
      {/* --- HEADER --- */}
      <div className={`p-5 flex justify-between items-center ${theme === "dark" ? "text-white" : "text-gray-800"}`}>
        <h2 className="text-2xl font-bold tracking-tight">Messages</h2>
        <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsInviteModalOpen(true)}
          className="p-3 bg-green-500 text-white rounded-xl shadow-lg shadow-green-500/20 hover:bg-green-600 transition-all"
        >
          <FaPlus />
        </motion.button>
      </div>

      {/* --- SEARCH BAR --- */}
      <div className="px-4 pb-4">
        <div className="relative group">
          <FaSearch className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${
            theme === "dark" ? "text-gray-500 group-focus-within:text-green-500" : "text-gray-400 group-focus-within:text-green-500"
          }`} />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerms}
            onChange={(e) => setSearchTerms(e.target.value)}
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl border-none focus:ring-2 focus:ring-green-500 outline-none transition-all ${
              theme === "dark" ? "bg-[#202c33] text-white placeholder-gray-500" : "bg-gray-100 text-black placeholder-gray-400"
            }`}
          />
        </div>
      </div>

      {/* --- CHAT LIST --- */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {filteredContacts.length > 0 ? (
          filteredContacts.map((contact) => (
            <motion.div
              key={contact._id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => setSelectedContact(contact)}
              className={`flex items-center p-4 mx-2 mb-1 rounded-2xl cursor-pointer transition-all duration-200 ${
                selectedContact?._id === contact._id
                  ? (theme === "dark" ? "bg-[#2a3942]" : "bg-gray-200")
                  : (theme === "dark" ? "hover:bg-[#202c33]" : "hover:bg-gray-50")
              }`}
            >
              {/* Profile Image with Online Indicator */}
              <div className="relative">
                <img
                  src={contact?.profilePicture || "https://ui-avatars.com/api/?name=" + contact.username}
                  alt={contact?.username}
                  className="w-12 h-12 rounded-full object-cover shadow-sm"
                />
                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-[#111b21] rounded-full"></div>
              </div>

              <div className="ml-4 flex-1 truncate">
                <div className="flex justify-between items-baseline">
                  <h3 className={`font-semibold text-[15px] ${theme === "dark" ? "text-gray-100" : "text-gray-900"}`}>
                    {contact?.username}
                  </h3>
                  <span className="text-[11px] text-gray-500 font-medium">
                    {contact?.conversation?.lastMessage?.createdAt 
                      ? formatTimeStamp(contact.conversation.lastMessage.createdAt)
                      : "New"}
                  </span>
                </div>
                
                <div className="flex justify-between items-center mt-0.5">
                  <p className={`text-sm truncate pr-2 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                    {contact?.conversation?.lastMessage?.content || "Tap to start chatting"}
                  </p>
                  {contact?.conversation?.unreadCount > 0 && (
                    <span className="bg-green-500 text-white text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full">
                      {contact.conversation.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-64 px-10 text-center">
            <div className="p-4 bg-gray-100 dark:bg-[#202c33] rounded-full mb-4">
              <FaSearch className="text-gray-400 text-2xl" />
            </div>
            <p className="text-gray-500 text-sm">No conversations found matching "{searchTerms}"</p>
          </div>
        )}
      </div>

      {/* --- INVITE MODAL --- */}
      <AnimatePresence>
        {isInviteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`w-full max-w-sm p-6 rounded-3xl shadow-2xl ${
                theme === "dark" ? "bg-[#2a3942] text-white" : "bg-white text-gray-800"
              }`}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">New Chat</h3>
                <button onClick={() => setIsInviteModalOpen(false)} className="text-gray-400 hover:text-red-500">
                  <FaTimes />
                </button>
              </div>
              
              <div className="space-y-4">
                <p className="text-sm text-gray-400">Enter a user's email or phone number to add them to your contacts.</p>
                <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Email or Phone..." 
                      value={contactInput}
                      onChange={(e) => setContactInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddContact()}
                      className={`flex-1 px-4 py-2 rounded-xl outline-none border ${theme === "dark" ? "bg-[#111b21] border-gray-700" : "bg-gray-50 border-gray-200"}`}
                      disabled={isAdding}
                    />
                    <button 
                      onClick={handleAddContact}
                      disabled={isAdding}
                      className={`bg-green-500 px-4 py-2 rounded-xl text-white hover:bg-green-600 transition-colors ${isAdding ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      {isAdding ? <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" /> : <FaUserPlus />}
                    </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatList;