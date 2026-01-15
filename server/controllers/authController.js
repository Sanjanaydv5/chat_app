//Step-1 Send OTP
const sendOTP = async (req, res) => {
    const {phoneNumber,phoneSuffix,email} = req.body;
    const otp = otpGenerate();
    const expiry = new Date(Date.now() + 5*60*1000); //5 minutes from now
    let user;
    try {
        if(email){
            user = await User.findOne(
                {email});
                if(!user){
                    user = new User({email});
                }
                user.emailOTP = otp;
                user.emailOTPExpiry = expiry;
                await user.save();

                return Response(res, 200, true, "OTP sent to email", {email});
        }
        if(phoneNumber && phoneSuffix){
            return Response (res, 400, "phoneNumber and phoneSuffix are required");
        }
        const fullPhoneNumber = `+${phoneSuffix}${phoneNumber}`;
        user = await User.findOne({phoneNumber});
        if(!user){
            user = await new User({phoneNumber, phoneSuffix});
        }
        await user.save();
        return Response(res, 200, true, "OTP sent to phone successfully", user);
    } catch (error) {
        console.error("Error in sendOTP:", error);
        return Response(res, 500, false, "Internal Server Error");
    }
}