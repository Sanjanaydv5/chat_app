import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FaWhatsapp,
  FaUserCircle,
  FaCog
} from "react-icons/fa";
import { IoMdRadioButtonOn } from "react-icons/io";

import useThemeStore from "../store/themeStore";
import useUserStore from "../store/useUserStore";
import useLayoutStore from "../store/layoutStore";

const Sidebar = () => {
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const { theme } = useThemeStore();
  const { user } = useUserStore();
  const { activeTab, setActiveTab, selectedContact } = useLayoutStore();

  useEffect(() => {
    const resize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  useEffect(() => {
    const map = {
      "/": "chats",
      "/status": "status",
      "/user-profile": "profile",
      "/setting": "setting",
    };
    setActiveTab(map[location.pathname]);
  }, [location, setActiveTab]);

  if (isMobile && selectedContact) return null;

  const NavItem = ({ to, tab, icon }) => {
    const isActive = activeTab === tab;

    return (
      <Link to={to} onClick={() => setActiveTab(tab)}>
        <motion.div
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.95 }}
          className={`relative p-3 rounded-xl transition-all duration-200
            ${isActive
              ? "bg-green-500/20"
              : "hover:bg-gray-300/20"
            }`}
        >
          {icon}

          {isActive && (
            <motion.span
              layoutId="active-dot"
              className="absolute -right-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-green-500"
            />
          )}
        </motion.div>
      </Link>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`
        ${isMobile
          ? "fixed bottom-0 left-0 right-0 h-16 flex-row"
          : "w-16 h-screen flex-col"}
        flex items-center justify-between py-4
        ${theme === "dark"
          ? "bg-gray-900 border-gray-700"
          : "bg-[rgb(239,242,254)] border-gray-300"}
        border-r shadow-lg z-50
      `}
    >
      {/* TOP */}
      <div className={`${isMobile ? "flex gap-6" : "flex flex-col gap-8"}`}>
        <NavItem
          to="/"
          tab="chats"
          icon={<FaWhatsapp className="h-6 w-6 text-green-500" />}
        />

        <NavItem
          to="/status"
          tab="status"
          icon={<IoMdRadioButtonOn className="h-6 w-6 text-blue-500" />}
        />
      </div>

      {/* BOTTOM */}
      <div className={`${isMobile ? "flex gap-6" : "flex flex-col gap-8"}`}>
        <NavItem
        to="/user-profile"
        tab="profile"
        icon={
    <div className="flex items-center justify-center w-8 h-8 overflow-hidden rounded-full ring-2 ring-transparent hover:ring-green-400 transition-all">
      {user?.profilePicture ? (
        <img
          src={user?.profilePicture}
          alt="Profile"
          className="h-full w-full object-cover"
          // If the image link is broken, hide it so the fallback can show
          onError={(e) => { e.target.style.display = 'none'; }}
        />
      ) : (
        <img
          src={"https://ui-avatars.com/api/?name=" + user?.username}
          alt="Avatar"
          className="h-full w-full object-cover"
        />
      )}
    </div>
  }
/>

        <NavItem
          to="/setting"
          tab="setting"
          icon={<FaCog className="h-6 w-6 text-gray-500" />}
        />
      </div>
    </motion.div>
  );
};

export default Sidebar;
