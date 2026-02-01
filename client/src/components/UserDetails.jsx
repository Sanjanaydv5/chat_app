import React, { useState } from "react";

const ChatDetails = () => {
  // Mock user data, you can replace this with real user data from API or context
  const [user, setUser] = useState({
    username: "Sanjana Yadav",
    email: "sanjana@example.com",
    phone: "+977 9800000000",
    profilePic: "https://i.pravatar.cc/150?img=47", // placeholder image
  });

  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState(user);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpdate = () => {
    setUser(formData);
    setEditMode(false);
    alert("Profile updated successfully!");
  };

  return (
    <div className="max-w-xl mx-auto mt-12 p-6 bg-white shadow-lg rounded-2xl border border-gray-200">
      <div className="flex flex-col items-center">
        <div className="relative">
          <img
            src={user.profilePic}
            alt="Profile"
            className="w-32 h-32 rounded-full border-4 border-indigo-500 object-cover"
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
              className="border-b-2 border-indigo-400 focus:outline-none text-center"
            />
          ) : (
            user.username
          )}
        </h2>
        <p className="text-gray-500 mt-1">
          {editMode ? (
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="border-b-2 border-indigo-400 focus:outline-none text-center"
            />
          ) : (
            user.email
          )}
        </p>
        <p className="text-gray-500 mt-1">
          {editMode ? (
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="border-b-2 border-indigo-400 focus:outline-none text-center"
            />
          ) : (
            user.phone
          )}
        </p>

        <div className="mt-6 flex gap-4">
          {editMode ? (
            <>
              <button
                onClick={handleUpdate}
                className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-md transition"
              >
                Save
              </button>
              <button
                onClick={() => setEditMode(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg shadow-md transition"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditMode(true)}
              className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-2 rounded-lg shadow-md transition"
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
