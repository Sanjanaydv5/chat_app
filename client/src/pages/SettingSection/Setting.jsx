import React, { useState } from "react";
import useThemeStore from "../../store/themeStore";
import useUserStore from "../../store/useUserStore";
import { logoutUser } from "../../services/user.service";
import { toast } from "react-toastify";
import {
  FaSearch,
  FaUser,
  FaComment,
  FaQuestionCircle,
  FaMoon,
  FaSun,
  FaSignOutAlt,
} from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";

const Setting = () => {
  const [isThemeDialogOpen, setIsThemeDialogOpen] = useState(false);
  const { theme, setTheme } = useThemeStore();
  const { user, clearUser } = useUserStore();
  const navigate = useNavigate();

  const toggleThemeDialog = () => {
    setIsThemeDialogOpen((prev) => !prev);
  };

  // ✅ FIXED LOGOUT
  const handleLogout = async () => {
    try {
      await logoutUser(); // backend clears cookie/session
      clearUser(); // zustand clear
      localStorage.clear(); // safety
      toast.success("Logged out successfully");
      navigate("/login"); // redirect
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Logout failed");
    }
  };

  return (
    <div
      className={`flex h-screen ${
        theme === "dark"
          ? "bg-[#0b141a] text-white"
          : "bg-[#f0f2f5] text-black"
      }`}
    >
      {/* LEFT PANEL */}
      <div
        className={`w-[420px] border-r ${
          theme === "dark" ? "border-gray-700" : "border-gray-300"
        }`}
      >
        <div className="p-4">
          <h1 className="text-xl font-semibold mb-4">Settings</h1>

          {/* SEARCH */}
          <div className="relative mb-4">
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search settings"
              className={`w-full pl-10 py-2 rounded-lg outline-none ${
                theme === "dark"
                  ? "bg-[#202c33] text-white"
                  : "bg-white"
              }`}
            />
          </div>

          {/* USER CARD */}
          {user && (
            <div
              className={`flex items-center gap-4 p-3 rounded-lg mb-4 ${
                theme === "dark"
                  ? "bg-[#202c33]"
                  : "bg-white shadow-sm"
              }`}
            >
              <img
                src={user.profilePicture || "/default-avatar.png"}
                alt="profile"
                className="w-14 h-14 rounded-full object-cover"
              />
              <div>
                <h2 className="font-semibold">{user.username}</h2>
                <p className="text-sm text-gray-400">
                  {user.about || "Hey there! I am using Chat App"}
                </p>
              </div>
            </div>
          )}

          {/* MENU */}
          <div className="space-y-1">
            <div className="text-[15px] font-medium space-y-1">
  <SettingsItem
    to="/user-profile"
    icon={FaUser}
    label="Account"
    theme={theme}
  />

  <SettingsItem
    to="/"
    icon={FaComment}
    label="Chats"
    theme={theme}
  />

  <SettingsItem
    to="/help"
    icon={FaQuestionCircle}
    label="Help"
    theme={theme}
  />
</div>

            {/* THEME */}
            <button
              onClick={toggleThemeDialog}
              className={`w-full flex items-center gap-3 p-3 rounded-lg ${
                theme === "dark"
                  ? "hover:bg-[#202c33]"
                  : "hover:bg-white"
              }`}
            >
              {theme === "dark" ? <FaMoon /> : <FaSun />}
              <span className="flex-1 text-left">Theme</span>
              <span className="text-sm text-gray-400 capitalize">
                {theme}
              </span>
            </button>

            {/* LOGOUT */}
            <button
              onClick={handleLogout}
              className={`w-full flex items-center gap-3 p-3 rounded-lg mt-6 text-red-500 ${
                theme === "dark"
                  ? "hover:bg-[#202c33]"
                  : "hover:bg-white"
              }`}
            >
              <FaSignOutAlt />
              Log out
            </button>
          </div>
        </div>
      </div>

      {/* THEME MODAL */}
      {isThemeDialogOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-20"
          onClick={toggleThemeDialog}
        >
          <div
            className={`p-6 rounded-xl w-[300px] ${
              theme === "dark" ? "bg-[#202c33]" : "bg-white"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg mb-4 font-semibold">Choose theme</h2>

            <label className="flex items-center gap-3 mb-3 cursor-pointer">
              <input
                type="radio"
                checked={theme === "light"}
                onChange={() => setTheme("light")}
              />
              Light
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                checked={theme === "dark"}
                onChange={() => setTheme("dark")}
              />
              Dark
            </label>

            <button
              onClick={toggleThemeDialog}
              className="mt-5 w-full bg-[#00a884] text-white py-2 rounded-lg"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const SettingsItem = ({ to, icon: Icon, label, theme }) => (
  <Link
    to={to}
    className={`flex items-center gap-3 p-3 rounded-lg ${
      theme === "dark"
        ? "hover:bg-[#202c33]"
        : "hover:bg-white"
    }`}
  >
    <Icon />
    <span>{label}</span>
  </Link>
);

export default Setting;
