const User = require("../models/User");
const { sendOtpToEmail } = require("../services/emailService");
const otpGenerate = require("../utils/otpGenerater");
const response = require("../utils/responseHandler");
const tiwilioService = require("../services/twilioService");
const generateToken = require("../utils/generateToken");
const { uploadFileToCloudinary } = require("../utils/cloudinaryUpload");
const conversation = require("../models/Conversation");



//Step-1 Send OTP
const sendOTP = async (req, res) => {
    const { phoneNumber, phoneSuffix, email } = req.body;
    const otp = otpGenerate();
    const expiry = new Date(Date.now() + 5 * 60 * 1000);

    try {
        let user;

        /* -------- EMAIL OTP -------- */
        if (email) {
            user = await User.findOne({ email });
            console.log("sendOTP: Email OTP request for:", email);
            console.log("sendOTP: Existing user found:", !!user);

            if (!user) {
                console.log("sendOTP: Creating new user for email:", email);
                user = new User({
                    email,
                    isVerified: false,
                    agreed: false
                });
            } else {
                console.log("sendOTP: Using existing user:", user._id);
            }

            user.emailOtp = otp;
            user.emailOtpExpiry = expiry;
            await user.save();

            try {
                await sendOtpToEmail(email, otp);
            } catch (mailError) {
                console.error("Email service failed:", mailError);
                if (process.env.NODE_ENV !== 'production') {
                    console.log(`\n[DEV] OTP for ${email}: ${otp}\n`);
                    return response(res, 200, true, "OTP sent (check server console in dev mode)", { email });
                }
                return response(res, 500, false, "Failed to send OTP email");
            }

            return response(res, 200, true, "OTP sent to email", { email });
        }

        /* -------- PHONE OTP -------- */
        if (!phoneNumber || !phoneSuffix) {
            return response(res, 400, false, "phoneNumber and phoneSuffix are required");
        }

        const fullPhoneNumber = `+${phoneSuffix}${phoneNumber}`;
        console.log("sendOTP: Phone OTP request for:", fullPhoneNumber);
        user = await User.findOne({ phoneNumber });
        console.log("sendOTP: Existing user found:", !!user);

        if (!user) {
            console.log("sendOTP: Creating new user for phone:", phoneNumber);
            user = new User({
                phoneNumber,
                phoneSuffix,
                isVerified: false,
                agreed: false
            });
        } else {
            console.log("sendOTP: Using existing user:", user._id);
        }

        const twilioConfigured = !!(process.env.TWILLO_ACCOUNT_SID &&
                                    process.env.TWILLO_AUTH_TOKEN &&
                                    process.env.TWILLO_SERVICE_SID);
        if (twilioConfigured) {
            try {
                await tiwilioService.sendOtpToPhoneNumber(fullPhoneNumber);
            } catch (twilioError) {
                console.error("Twilio error:", twilioError);
                return response(res, 500, false, "Failed to send OTP to phone");
            }
        } else {
            if (process.env.NODE_ENV !== 'production') {
                // Store OTP in DB for dev-mode verification (when Twilio is not configured)
                user.emailOtp = otp;
                user.emailOtpExpiry = expiry;
                await user.save();
                console.log(`\n[DEV] OTP for ${fullPhoneNumber}: ${otp}\n`);
                return response(res, 200, true, "OTP sent to phone successfully");
            }
            return response(res, 500, false, "SMS service not configured");
        }

        await user.save();
        return response(res, 200, true, "OTP sent to phone successfully");

    } catch (error) {
        console.error("Error in sendOTP:", error);
        return response(res, 500, false, "Internal Server Error");
    }
};


// Step-2 Verify OTP
const verifyOTP = async (req, res) => {
    const { phoneNumber, phoneSuffix, email, otp } = req.body;
    console.log("verifyOTP: Request for email=", email, "phoneNumber=", phoneNumber);

    try {
        let user;

        if (email) {
            user = await User.findOne({ email });
            console.log("verifyOTP: User found by email:", !!user, user?._id);
            if (!user) {
                return response(res, 404, false, "User not found");
            }

            const now = new Date();
            if (
                !user.emailOtp ||
                String(user.emailOtp) !== String(otp) ||
                now > new Date(user.emailOtpExpiry)
            ) {
                return response(res, 400, false, "Invalid or expired OTP");
            }

            user.isVerified = true;
            user.emailOtp = null;
            user.emailOtpExpiry = null;
            await user.save();
        } else {
            if (!phoneNumber || !phoneSuffix) {
                return response(res, 400, false, "phoneNumber and phoneSuffix are required");
            }

            const fullPhoneNumber = `+${phoneSuffix}${phoneNumber}`;
            user = await User.findOne({ phoneNumber });

            if (!user) {
                return response(res, 404, false, "User not found");
            }

            const twilioConfigured = !!(process.env.TWILLO_ACCOUNT_SID &&
                                        process.env.TWILLO_AUTH_TOKEN &&
                                        process.env.TWILLO_SERVICE_SID);
            if (twilioConfigured) {
                const result = await tiwilioService.verifyOtp(fullPhoneNumber, otp);
                if (result.status !== "approved") {
                    return response(res, 400, false, "Invalid or expired OTP");
                }
            } else {
                // Dev-mode fallback: verify against DB-stored OTP
                const now = new Date();
                if (
                    !user.emailOtp ||
                    String(user.emailOtp) !== String(otp) ||
                    now > new Date(user.emailOtpExpiry)
                ) {
                    return response(res, 400, false, "Invalid or expired OTP");
                }
                user.emailOtp = null;
                user.emailOtpExpiry = null;
            }

            user.isVerified = true;
            await user.save();
        }

        const token = generateToken(user._id);
        res.cookie("auth_token", token, {
            httpOnly: true,
            sameSite: 'strict',
            maxAge: 1000 * 60 * 60 * 24 * 365
        });

        return response(res, 200, true, "OTP verified successfully", { user, token });

    } catch (error) {
        console.error("Error in verifyOTP:", error);
        return response(res, 500, false, "Internal Server Error");
    }
};


const updateProfile = async (req, res) => {
    // Implementation for updating user profile
    const { username, agreed, about, profilePicture } = req.body;
    const userId = req.user.id;  // Changed from userId to id (matches generateToken)
    console.log("updateProfile: userId=", userId);
    console.log("updateProfile: Request body=", req.body);
    
    try {
        const user = await User.findById(userId);
        if (!user) {
            console.log("updateProfile: User not found");
            return response(res, 404, false, "User not found");
        }

        console.log("updateProfile: Current user data=", { username: user.username, profilePicture: user.profilePicture });

        // Update profile picture if provided
        if (profilePicture) {
            user.profilePicture = profilePicture;
        }

        if (username) user.username = username;
        if (agreed !== undefined) user.agreed = agreed;
        if (about) user.about = about;
        
        await user.save();
        console.log("updateProfile: Updated user data=", { username: user.username, profilePicture: user.profilePicture });
        
        // Generate new token with updated user info
        const token = generateToken(user._id);
        res.cookie("auth_token", token, {
            httpOnly: true,
            sameSite: 'strict',
            maxAge: 1000 * 60 * 60 * 24 * 365
        });
        
        return response(res, 200, true, "Profile updated successfully", { user, token });
    } catch (error) {
        console.error("Error in updateProfile:", error);
        return response(res, 500, false, "Internal Server Error");
    }
}

const checkAuthenticated = async (req, res) => {
    try {
        const userId = req.user.id;  // Changed from userid to id
        if (!userId) {
            return response(res, 404, false, "User not authenticated! please login");
        }
        const user = await User.findById(userId);
        if (!user) {
            return response(res, 404, false, "User not found");
        }
        return response(res, 200, true, "User is authenticated and allow to use this chat app", user);
    } catch (error) {
        console.error("Error in checkAuthenticated:", error);
        return response(res, 500, false, "Internal Server Error");
    }
}


const logout = (req, res) => {
    try {
        res.cookie("auth_token", "", { expires: new Date(0) });
        return response(res, 200, true, "Logged out successfully");
    } catch (error) {
        console.error("Error in logout:", error);
        return response(res, 500, false, "Internal Server Error");
    }
}

const getAllUsers = async (req, res) => {
    const loggedInUser = req.user.id;
    try {
        const users = await User.find({ _id: { $ne: loggedInUser } }).select(
            "username profilePicture lastSeen about"
        ).lean();

        const usersWithConversations = await Promise.all(users.map(async (user) => {
            // Fetch or create conversation logic can be added here
            const conversationData = await conversation.findOne({
                participants: { $all: [loggedInUser, user?._id] }
            }).populate(
                {
                    path: "lastMessage",
                    select: "content createdAt sender receiver"
                }
            ).lean();
            return {
                ...user,
                conversation: conversationData || null
            };
        }));

        return response(res, 200, true, "Users fetched successfully", {
            users: usersWithConversations
        })
    } catch (error) {
        console.error("Error in getAllUsers:", error);
        return response(res, 500, false, "Internal Server Error");
    }
}

    module.exports = {
        sendOTP,
        verifyOTP, updateProfile, logout, checkAuthenticated, getAllUsers
    };