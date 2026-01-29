import React, { useState } from "react";
import useThemeStore from "../../store/themeStore";
import useUserStore from "../../store/useUserStore";
import { logoutUser } from "../../services/user.service";
import { toast } from "react-toastify";
import Layout from "../../components/Layout";
import {
  FaSearch,
  FaUser,
  FaComment,
  FaQuestionCircle,
  FaMoon,
  FaSun,
  FaSignInAlt,
} from "react-icons/fa";
import { Link } from "react-router-dom";

const Setting = () => {
  const [isThemeDialogOpen, setIsThemeDialogOpen] = useState(false);
  const { theme } = useThemeStore();
  const { user, clearUser } = useUserStore();

  const toggleThemeDialog = () => {
    setIsThemeDialogOpen((prev) => !prev);
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      clearUser();
      toast.success("User logged out successfully");
    } catch (error) {
      console.error("Failed to logout", error);
      toast.error("Logout failed");
    }
  };

  return (
    <Layout
      isThemeDialogOpen={isThemeDialogOpen}
      toogleThemeDialog={toggleThemeDialog}
    >
      <div
        className={`flex h-screen ${
          theme === "dark"
            ? "bg-[rgb(17,27,44)] text-white"
            : "bg-white text-black"
        }`}
      >
        <div
          className={`w-[400px] border-r ${
            theme === "dark" ? "border-gray-600" : "border-gray-200"
          }`}
        >
          <div className="p-4">
            <h1 className="text-xl font-semibold mb-4">Settings</h1>

            {/* Search */}
            <div className="relative mb-4">
              <FaSearch className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search settings"
                className={`w-full pl-10 p-2 rounded border-none placeholder-gray-400 ${
                  theme === "dark"
                    ? "bg-[#202c33] text-white"
                    : "bg-gray-100 text-black"
                }`}
              />
            </div>

            {/* User Profile */}
            {user && (
              <div
                className={`flex items-center gap-4 p-3 rounded-lg cursor-pointer mb-4 ${
                  theme === "dark"
                    ? "hover:bg-[#202c33]"
                    : "hover:bg-gray-100"
                }`}
              >
                <img
                  src={user?.profilePicture || "/default-avatar.png"}
                  alt="profile"
                  className="w-14 h-14 rounded-full object-cover"
                />
                <div>
                  <h2 className="font-semibold">{user?.username}</h2>
                  <p className="text-sm text-gray-400">{user?.about}</p>
                </div>
              </div>
            )}

            {/* Menu */}
            <div className="h-[calc(100vh-250px)] overflow-y-auto space-y-1">
              {[
                { icon: FaUser, label: "Account", href: "/user-profile" },
                { icon: FaComment, label: "Chats", href: "/" },
                { icon: FaQuestionCircle, label: "Help", href: "/help" },
              ].map((item) => (
                <Link
                  to={item.href}
                  key={item.label}
                  className={`flex items-center gap-3 p-2 rounded ${
                    theme === "dark"
                      ? "text-white hover:bg-[#202c33]"
                      : "text-black hover:bg-gray-100"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <div
                    className={`flex-1 border-b p-2 ${
                      theme === "dark"
                        ? "border-gray-700"
                        : "border-gray-200"
                    }`}
                  >
                    {item.label}
                  </div>
                </Link>
              ))}

              {/* Theme Toggle */}
              <button
                onClick={toggleThemeDialog}
                className={`w-full flex items-center gap-3 p-2 rounded ${
                  theme === "dark"
                    ? "text-white hover:bg-[#202c33]"
                    : "text-black hover:bg-gray-100"
                }`}
              >
                {theme === "dark" ? (
                  <FaMoon className="h-5 w-5" />
                ) : (
                  <FaSun className="h-5 w-5" />
                )}
                <div
                  className={`flex flex-col text-start border-b w-full p-2 ${
                    theme === "dark"
                      ? "border-gray-700"
                      : "border-gray-200"
                  }`}
                >
                  Theme
                  <span className="ml-auto text-sm text-gray-400">
                    {theme.charAt(0).toUpperCase() + theme.slice(1)}
                  </span>
                </div>
              </button>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className={`w-full flex items-center gap-3 p-2 rounded mt-10 text-red-500 ${
                  theme === "dark"
                    ? "hover:bg-[#202c33]"
                    : "hover:bg-gray-100"
                }`}
              >
                <FaSignInAlt className="h-5 w-5" />
                Log out
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Setting;
