const twillo = require('twilio');


// Twilio Credentials from .env file
const accountSid = process.env.TWILLO_ACCOUNT_SID;
const authToken = process.env.TWILLO_AUTH_TOKEN;
const serviceSid = process.env.TWILLO_SERVICE_SID;

// Create a Twilio client
const client = twillo(accountSid, authToken);

// send verification code to user's phone number//
const sendOtpToPhoneNumber = async (phoneNumber) => {
  try {
    console.log('Sending OTP to phone number:', phoneNumber);
    if (!phoneNumber) {
      throw new Error('Phone number is required');
    }
    const response = await client.verify.v2.services(serviceSid).verifications.create({
        to: phoneNumber,
        channel: 'sms',
    });
    console.log('OTP sent successfully:', response);
    return response;
  } catch (error) {
    console.error('Error sending OTP:', error.message || error);
    console.error('Error code:', error.code);
    console.error('Error status:', error.status);
    throw error;
  }
};


// verify the OTP entered by the user
const verifyOtp = async (phoneNumber, otp) => {
  try {
    console.log('This is my otp:', otp);
    console.log('Verifying OTP for phone number:', phoneNumber);
    const response = await client.verify.v2.services(serviceSid).verificationChecks.create({
        to: phoneNumber,
        code: otp,
    });
    console.log('This is my otp response', response);
    return response;
  } catch (error) {
    console.error(error);
    throw new Error('Error verifying OTP');
  }
};

module.exports = {
  sendOtpToPhoneNumber,
  verifyOtp,
};