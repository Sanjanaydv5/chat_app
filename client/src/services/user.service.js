import axiosInstance from "./url.service";

// ---------------- SEND OTP ----------------
export const sendOtp = async (phoneNumber, phoneSuffix, email) => {
  try {
    const response = await axiosInstance.post("/auth/send-otp", {
      phoneNumber,
      phoneSuffix,
      email,
    });
    return response.data;
  } catch (error) {
    throw error.response? error.response.data : error.message;
  }
};

// ---------------- VERIFY OTP ----------------
export const verifyOtp = async (phoneNumber, phoneSuffix, email, otp) => {
  try {
    const res = await axiosInstance.post("/auth/verify-otp", {
      phoneNumber,
      phoneSuffix,
      email,
      otp,
    });
    return res.data;
  } catch (error) {
    throw error.response ? error.response.data : error.message;
  }
};

// ---------------- UPDATE PROFILE ----------------
export const updateUserProfile = async (updateData) => {
  try {
    const response = await axiosInstance.put("/auth/update-profile", updateData);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error.message;
  }
};

// ---------------- CHECK AUTH ----------------
export const checkUserAuth = async () => {
  try {
    const response = await axiosInstance.get("/auth/check-authenticated");

    if (response.data?.success) {
      return {
        isAuthenticated: true,
        user: response.data.data,
      };
    }

    return { isAuthenticated: false };
  } catch (error) {
    return { isAuthenticated: false };
  }
};

// ---------------- LOGOUT ----------------
export const logoutUser = async () => {
  try {
    const response = await axiosInstance.get("/auth/logout");
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error.message;
  }
};

// ---------------- GET ALL USERS ----------------
export const getAllUsers = async () => {
  try {
    const response = await axiosInstance.get("/auth/users");
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error.message;
  }
};
