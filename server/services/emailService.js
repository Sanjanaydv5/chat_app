const nodemailer = require("nodemailer");
const resendLib = require("../utils/resend");

const buildOtpHtml = (otp) => `
  <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
    <h2 style="color: #075e54;">WhatsApp Web Verification</h2>
    <p>Hi there,</p>
    <p>Your one-time password (OTP) to verify your account is:</p>
    <h1 style="background: #e0f7fa; color: #000; padding: 10px 20px; display: inline-block;
               border-radius: 5px; letter-spacing: 2px;">${otp}</h1>
    <p><strong>This OTP is valid for the next 5 minutes.</strong> Please do not share this code with anyone.</p>
    <p>If you did not request this OTP, please ignore this email.</p>
    <p style="margin-top: 20px;">Thanks and Regards,<br/>Sanjana's chat_app</p>
    <hr style="margin: 30px 0;" />
    <small style="color: #777;">This is an automated message. Please do not reply.</small>
  </div>
`;

// Create the Gmail transporter once at startup (only when credentials are present)
const gmailTransporter = (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD)
  ? nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    })
  : null;

const sendOtpToEmail = async (email, otp) => {
  if (!email) throw new Error("Email is required");

  const html = buildOtpHtml(otp);
  const subject = "Your WhatsApp Web Verification OTP";

  // --- 1. Try Gmail SMTP (nodemailer) ---
  if (gmailTransporter) {
    await gmailTransporter.sendMail({
      from: `"WhatsApp Web" <${process.env.GMAIL_USER}>`,
      to: email,
      subject,
      html,
    });
    console.log(`OTP email sent to ${email} via Gmail SMTP`);
    return true;
  }

  // --- 2. Try Resend ---
  if (process.env.RESEND_API_KEY) {
    await resendLib.emails.send({
      from: "WhatsApp Web <onboarding@resend.dev>",
      to: email,
      subject,
      html,
    });
    console.log(`OTP email sent to ${email} via Resend`);
    return true;
  }

  // --- 3. No email service configured ---
  throw new Error("No email service configured. Set GMAIL_USER/GMAIL_APP_PASSWORD or RESEND_API_KEY.");
};

module.exports = {
  sendOtpToEmail,
};
