const User = require("../models/User");
const { sendOtpToEmail } = require("../services/emailService");
const otpGenerate = require("../utils/otpGenerater");
const response = require("../utils/responseHandler");
const tiwilioService = require("../services/twilioService");



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
            user.emailOTP = otp;
            user.emailOTPExpiry = expiry;
            await user.save();

            await sendOtpToEmail(email, otp);
            return response(res, 200, true, "OTP sent to email", { email });
        }
        if (phoneNumber && phoneSuffix) {
            return response(res, 400, "phoneNumber and phoneSuffix are required");
        }
        const fullPhoneNumber = `+${phoneSuffix}${phoneNumber}`;
        user = await User.findOne({ phoneNumber });
        if (!user) {
            user = await new User({ phoneNumber, phoneSuffix });
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
            if (!user.emailOTP || String(user.emailOTP) !== String(otp) || now > new Date(user.emailOTPExpiry)) {
                return response(res, 400, false, "Invalid or Expired OTP");
            };
            user.isVerified = true;
            user.emailOTP = null;
            user.emailOTPExpiry = null;
            await user.save();
        } else {
            if (phoneNumber && phoneSuffix) {
                return response(res, 400, "phoneNumber and phoneSuffix are required");
            }
            const fullPhoneNumber = `+${phoneSuffix}${phoneNumber}`;
            user = await User.findOne({ phoneNumber });
            if (!user) {
                return response(res, 404, false, "User not found");
            }
            const result = await tiwilioService.verifyOtp(fullPhoneNumber, otp);
            if (!result.status !== "approved") {
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

module.exports = {
    sendOTP,
    verifyOTP,
};