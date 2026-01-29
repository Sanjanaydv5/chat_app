import axiosInstance from "./url.service";

// ---------------- SEND OTP ----------------
export const sendOtp = async (phoneNumber, phoneSuffix, email) => {
  try {
    const res = await axiosInstance.post("/auth/send-otp", {
      phoneNumber,
      phoneSuffix,
      email,
    });
    return res.data;
  } catch (error) {
    throw error.response?.data || error.message;
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
    throw error.response?.data || error.message;
  }
};

// ---------------- UPDATE PROFILE ----------------
export const updateUserProfile = async (updateData) => {
  try {
    const res = await axiosInstance.put("/auth/update-profile", updateData);
    return res.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// ---------------- CHECK AUTH ----------------
export const checkUserAuth = async () => {
  try {
    const res = await axiosInstance.get("/auth/check-authenticated");

    if (res.data?.success) {
      return {
        isAuthenticated: true,
        user: res.data.data,
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
    const res = await axiosInstance.get("/auth/logout");
    return res.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// ---------------- GET ALL USERS ----------------
export const getAllUsers = async () => {
  try {
    const res = await axiosInstance.get("/auth/users");
    return res.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};
