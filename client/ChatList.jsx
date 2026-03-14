import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaPlus, FaSearch, FaTimes } from "react-icons/fa";
import { toast } from "react-toastify";

import useChatStore from "../../store/chatStore";
import useLayoutStore from "../../store/layoutStore";
import useThemeStore from "../../store/themeStore";
import useUserStore from "../../store/useUserStore";
import { sendOtp } from "../../services/user.service";
import formatTimeStamp from "../../utils/formatTime";

const ChatList = ({ contacts = [] }) => {
  const setSelectedContact = useLayoutStore((state) => state.setSelectedContact);
  const selectedContact = useLayoutStore((state) => state.selectedContact);
  const { theme } = useThemeStore();
  const { user: currentUser } = useUserStore();
  const { conversations, fetchConversations, createGroupConversation } = useChatStore();

  const [searchTerms, setSearchTerms] = useState("");
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [groupName, setGroupName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePhone, setInvitePhone] = useState("");
  const [invitePhoneSuffix, setInvitePhoneSuffix] = useState("");

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const normalizedContacts = (contacts || []).filter((contact) => contact._id !== currentUser?._id);

  const conversationEntries = (conversations?.data || []).map((conv) => {
    if (conv.isGroup) {
      return {
        _id: conv._id,
        isGroup: true,
        username: conv.name || "Group Chat",
        profilePicture: "https://ui-avatars.com/api/?name=" + encodeURIComponent(conv.name || "Group Chat"),
        conversation: conv,
      };
    }
    const otherUser = conv.participants.find((p) => p._id !== currentUser?._id);
    if (!otherUser) return null;
    return {
      ...otherUser,
      _id: otherUser._id,
      isGroup: false,
      conversation: conv,
    };
  }).filter(Boolean);

  const missingContacts = normalizedContacts.filter((contact) =>
    !conversationEntries.some((entry) => !entry.isGroup && entry._id === contact._id)
  );

  const entries = [...conversationEntries, ...missingContacts];

  const filteredEntries = entries.filter((entry) =>
    entry.username?.toLowerCase().includes(searchTerms.toLowerCase())
  );

  const userListForInvite = normalizedContacts.filter((contact) =>
    contact.username?.toLowerCase().includes(searchTerms.toLowerCase())
  );

  const toggleUserSelection = (userId) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleInviteEmail = async () => {
    if (!inviteEmail) {
      toast.error("Please provide an email");
      return;
    }
    try {
      await sendOtp(null, null, inviteEmail);
      toast.success(`Invitation OTP sent to ${inviteEmail}`);
      setInviteEmail("");
    } catch (error) {
      console.error(error);
      toast.error("Failed to invite by email");
    }
  };

  const handleInvitePhone = async () => {
    if (!invitePhone || !invitePhoneSuffix) {
      toast.error("Please provide phone number and suffix");
      return;
    }
    try {
      await sendOtp(invitePhone, invitePhoneSuffix, null);
      toast.success(`Invitation OTP sent to +${invitePhoneSuffix}${invitePhone}`);
      setInvitePhone("");
      setInvitePhoneSuffix("");
    } catch (error) {
      console.error(error);
      toast.error("Failed to invite by phone");
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      toast.error("Group name is required");
      return;
    }
    if (selectedUserIds.length === 0) {
      toast.error("Please select at least one user");
      return;
    }

    try {
      const result = await createGroupConversation({ groupName, participantIds: selectedUserIds });
      const groupConversation = result?.data || result;
      if (groupConversation) {
        setSelectedContact({
          ...groupConversation,
          isGroup: true,
          conversation: groupConversation,
        });
        setIsInviteModalOpen(false);
        setGroupName("");
        setSelectedUserIds([]);
        toast.success("Group created successfully");
      }
    } catch (error) {
      console.error(error);
      toast.error("Could not create group chat");
    }
  };

  return (
    <div className={`w-full h-screen flex flex-col border-r transition-all duration-300 ${
      theme === "dark" ? "bg-[#111b21] border-gray-700" : "bg-white border-gray-200"
    }`}>
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

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {filteredEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 px-10 text-center">
            <div className="p-4 bg-gray-100 dark:bg-[#202c33] rounded-full mb-4">
              <FaSearch className="text-gray-400 text-2xl" />
            </div>
            <p className="text-gray-500 text-sm">No conversations found matching "{searchTerms}"</p>
          </div>
        ) : (
          filteredEntries.map((entry) => (
            <motion.div
              key={entry._id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => setSelectedContact(entry)}
              className={`flex items-center p-4 mx-2 mb-1 rounded-2xl cursor-pointer transition-all duration-200 ${
                selectedContact?._id === entry._id
                  ? (theme === "dark" ? "bg-[#2a3942]" : "bg-gray-200")
                  : (theme === "dark" ? "hover:bg-[#202c33]" : "hover:bg-gray-50")
              }`}
            >
              <div className="relative">
                <img
                  src={entry.profilePicture || "https://ui-avatars.com/api/?name=" + (entry.username || "User")}
                  alt={entry.username}
                  className="w-12 h-12 rounded-full object-cover shadow-sm"
                />
                {!entry.isGroup && <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-[#111b21] rounded-full"></div>}
              </div>

              <div className="ml-4 flex-1 truncate">
                <div className="flex justify-between items-baseline">
                  <h3 className={`font-semibold text-[15px] ${theme === "dark" ? "text-gray-100" : "text-gray-900"}`}>
                    {entry.username}
                  </h3>
                  <span className="text-[11px] text-gray-500 font-medium">
                    {entry.conversation?.lastMessage?.createdAt ? formatTimeStamp(entry.conversation.lastMessage.createdAt) : "New"}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-0.5">
                  <p className={`text-sm truncate pr-2 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                    {entry.conversation?.lastMessage?.content || "Tap to start chatting"}
                  </p>
                  {entry.conversation?.unreadCount > 0 && (
                    <span className="bg-green-500 text-white text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full">
                      {entry.conversation.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <AnimatePresence>
        {isInviteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`w-full max-w-lg p-6 rounded-3xl shadow-2xl ${
                theme === "dark" ? "bg-[#2a3942] text-white" : "bg-white text-gray-800"
              }`}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">New Chat / Group</h3>
                <button onClick={() => setIsInviteModalOpen(false)} className="text-gray-400 hover:text-red-500">
                  <FaTimes />
                </button>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Group Name</label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Enter group name"
                  className="w-full px-3 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Select users to add</label>
                <div className="h-40 overflow-y-auto border rounded-lg p-2">
                  {userListForInvite.length === 0 && <p className="text-sm text-gray-500">No users found</p>}
                  {userListForInvite.map((user) => (
                    <label key={user._id} className="flex items-center gap-2 mb-1">
                      <input
                        type="checkbox"
                        checked={selectedUserIds.includes(user._id)}
                        onChange={() => toggleUserSelection(user._id)}
                        className="form-checkbox h-4 w-4"
                      />
                      <span>{user.username || user.email || user.phoneNumber}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">Invite by Email / Phone</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="Email"
                      className="w-full px-3 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <button onClick={handleInviteEmail} className="mt-2 w-full px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600">
                      Invite by Email
                    </button>
                  </div>
                  <div>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={invitePhoneSuffix}
                        onChange={(e) => setInvitePhoneSuffix(e.target.value)}
                        placeholder="Country code"
                        className="w-2/5 px-3 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                      <input
                        type="text"
                        value={invitePhone}
                        onChange={(e) => setInvitePhone(e.target.value)}
                        placeholder="Phone number"
                        className="w-3/5 px-3 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <button onClick={handleInvitePhone} className="w-full px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600">
                      Invite by Phone
                    </button>
                  </div>
                </div>
              </div>

              <button
                onClick={handleCreateGroup}
                className="w-full px-4 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600"
              >
                Create Group Chat
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatList;
