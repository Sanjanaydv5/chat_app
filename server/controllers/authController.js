const User = require("../models/User");
const { sendOtpToEmail } = require("../services/emailService");
const otpGenerate = require("../utils/otpGenerater");
const response = require("../utils/responseHandler");
const tiwilioService = require("../services/twilioService");
const generateToken = require("../utils/generateToken");



//Step-1 Send OTP
const sendOTP = async (req, res) => {
    const { phoneNumber, phoneSuffix, email } = req.body;
    const otp = otpGenerate();
    const expiry = new Date(Date.now() + 5 * 60 * 1000); //5 minutes from now
    let user;
    try {
        if (email) {
            user = await User.findOne(
                { email });
            if (!user) {
                user = new User({ email });
            }
            user.emailOtp = otp;
            user.emailOtpExpiry = expiry;
            await user.save();

            await sendOtpToEmail(email, otp);
            return response(res, 200, true, "OTP sent to email", { email });
        }
        if (!phoneNumber || !phoneSuffix) {
            return response(res, 400, false, "phoneNumber and phoneSuffix are required");
        }
        const fullPhoneNumber = `+${phoneSuffix}${phoneNumber}`;
        user = await User.findOne({ phoneNumber });
        if (!user) {
            user = new User({ phoneNumber, phoneSuffix });
        }
        await tiwilioService.sendOtpToPhoneNumber(fullPhoneNumber);
        await user.save();
        return response(res, 200, true, "OTP sent to phone successfully", user);
    } catch (error) {
        console.error("Error in sendOTP:", error);
        return response(res, 500, false, "Internal Server Error");
    }
}


// Step-2 Verify OTP
const verifyOTP = async (req, res) => {
    const { phoneNumber, phoneSuffix, email, otp } = req.body;

    try {
        let user;
        if (email) {
            user = await User.findOne({ email });
            if (!user) {
                return response(res, 404, false, "User not found");
            }
            const now = new Date();
            if (!user.emailOtp || String(user.emailOtp) !== String(otp) || now > new Date(user.emailOtpExpiry)) {
                return response(res, 400, false, "Invalid or Expired OTP");
            };
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
            const result = await tiwilioService.verifyOtp(fullPhoneNumber, otp);
            if (result.status !== "approved") {
                return response(res, 400, false, "Invalid or Expired OTP");
            }
            user.isVerified = true;
            await user.save();
        }
        const token = generateToken(user?._id);
        res.cookie("auth_token", token, {
            httpOnly: true,
            maxAge:1000*60*60*24*365, //1 year
        });
        return response(res, 200, true, "OTP verified successfully", { user, token }
        )
    } catch (error) {
        console.error("Error in verifyOTP:", error);
        return response(res, 500, false, "Internal Server Error");
    }
}

const updateProfile = async (req, res) => {
    // Implementation for updating user profile
    const {username,agreed,about}=req.body;
    const userId = req.user.id;  // Changed from userId to id (matches generateToken)
    try {
        const user = await User.findById(userId);
        if (!user) {
            return response(res, 404, false, "User not found");
        }
        
        // For now, skip file upload if uploadFileToCloudinary is not set up
        // const file = req.file;
        // if(file){
        //     const uploadResult = await uploadFileToCloudinary(file);
        //     console.log("Upload Result:", uploadResult);
        //     user.profilePicture = uploadResult?.secure_url;
        // } else if (req.body.profilePicture) {
        //     user.profilePicture = req.body.profilePicture;
        // }

        if (username) user.username = username;
        if (agreed) user.agreed = agreed;
        if (about) user.about = about;
        await user.save();
        console.log(user);
        return response(res, 200, true, "Profile updated successfully", user);
    } catch (error) {
        console.error("Error in updateProfile:", error);
        return response(res, 500, false, "Internal Server Error");
    }
}

module.exports = {
    sendOTP,
    verifyOTP,updateProfile
};