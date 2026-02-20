import React, { useState, useEffect } from "react";
import { checkUserAuth, updateUserProfile } from "../services/user.service";
import useUserStore from "../store/useUserStore";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const ChatDetails = () => {
  const navigate = useNavigate();
  const { setUser } = useUserStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUserState] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phone: "",
    profilePic: "",
    about: ""
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const result = await checkUserAuth();

        if (result.authenticated && result.user) {
          const userData = {
            username: result.user.username || "",
            email: result.user.email || "",
            phone: result.user.phoneNumber
              ? `+${result.user.phoneSuffix}${result.user.phoneNumber}`
              : "",
            profilePic:
              result.user.profilePicture ||
              "https://i.pravatar.cc/150?img=47",
            about: result.user.about || ""
          };

          setUserState(userData);
          setFormData(userData);
          setUser(result.user);
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError("Failed to load user data");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [setUser]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpdate = async () => {
    try {
      const updateData = {
        username: formData.username,
        about: formData.about,
        profilePicture: formData.profilePic
      };

      const result = await updateUserProfile(updateData);

      if (result.status === "success") {
        setUserState(formData);
        if (result.data?.user) {
          setUser(result.data.user);
        }
        setEditMode(false);
        alert("Profile updated successfully!");
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      alert("Failed to update profile.");
    }
  };

  const handleCancel = () => {
    setFormData(user);
    setEditMode(false);
  };

  const handleExit = () => {
    navigate(-1); // go back to previous page
  };

  if (loading) {
    return (
      <div className="max-w-xl mx-auto mt-12 p-6 bg-white shadow-lg rounded-2xl border border-gray-200">
        <div className="flex flex-col items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
          <p className="mt-4 text-gray-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto mt-12 p-6 bg-white shadow-lg rounded-2xl border border-gray-200">
        <div className="flex flex-col items-center justify-center h-64">
          <p className="text-red-500">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-green-500 text-white px-4 py-2 rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto mt-12 bg-white shadow-lg rounded-2xl border border-gray-200 overflow-hidden">
      
      {/* ✅ Header with Exit Button */}
      <div className="flex items-center gap-4 bg-green-600 text-white px-4 py-3">
        <button onClick={handleExit}>
          <ArrowLeft size={22} />
        </button>
        <h2 className="text-lg font-semibold">Profile</h2>
      </div>

      <div className="p-6 flex flex-col items-center">
        <div className="relative">
          <img
            src={user?.profilePic}
            alt="Profile"
            className="w-32 h-32 rounded-full border-4 border-green-500 object-cover"
          />
          {editMode && (
            <input
              type="text"
              name="profilePic"
              value={formData.profilePic}
              onChange={handleChange}
              placeholder="Profile Image URL"
              className="absolute bottom-0 right-0 w-40 text-sm p-1 rounded-md border border-gray-300"
            />
          )}
        </div>

        <h2 className="mt-4 text-2xl font-semibold text-gray-800">
          {editMode ? (
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="border-b-2 border-green-400 focus:outline-none text-center"
            />
          ) : (
            user?.username
          )}
        </h2>

        <p className="text-gray-500 mt-1">{user?.email}</p>
        <p className="text-gray-500 mt-1">{user?.phone}</p>

        <div className="mt-6 flex gap-4">
          {editMode ? (
            <>
              <button
                onClick={handleUpdate}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg"
              >
                Save
              </button>
              <button
                onClick={handleCancel}
                className="bg-gray-300 px-4 py-2 rounded-lg"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditMode(true)}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg"
            >
              Edit Profile
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatDetails;