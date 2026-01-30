const nodemailer = require('nodemailer');

const dotenv = require('dotenv');
dotenv.config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    // Add timeout and connection settings
    pool: true,
    maxConnections: 1,
    maxMessages: 5,
    rateDelta: 1000,
    rateLimit: 5,
});

transporter.verify((error, success) => {
    if (error) {
        console.error('Error to Gmail connetion:', error);
    } else {
        console.log('Gmail configured properly and ready to send messages');
    }
});

const sendOtpToEmail = async (email, otp) => {
    try {
        const html = `
    <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
      <h2 style="color: #075e54;">🔐 WhatsApp Web Verification</h2>

      <p>Hi there,</p>

      <p>Your one-time password (OTP) to verify your WhatsApp Web account is:</p>

      <h1 style="background: #e0f7fa; color: #000; padding: 10px 20px; display: inline-block; border-radius: 5px; letter-spacing: 2px;">
        ${otp}
      </h1>

      <p><strong>This OTP is valid for the next 5 minutes.</strong> Please do not share this code with anyone.</p>

      <p>If you didn’t request this OTP, please ignore this email.</p>

      <p style="margin-top: 20px;">Thanks & Regards,<br/>Sanjana's chat_app</p>

      <hr style="margin: 30px 0;" />

      <small style="color: #777;">This is an automated message. Please do not reply.</small>
    </div>
  `;

        const mailOptions = {
            from: `"WhatsApp Web" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Your WhatsApp Web Verification OTP',
            html: html,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.messageId);
        return info;
    } catch (error) {
        console.error('Failed to send email:', error);
        throw new Error(`Email service failed: ${error.message}`);
    }
}


module.exports = {
    sendOtpToEmail,
};