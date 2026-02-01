const nodemailer = require("nodemailer");

// create transporter once
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // must be false for TLS
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});
//hii
// verify SMTP connection (runs on server start)
transporter.verify((error) => {
  if (error) {
    console.error("❌ SMTP Error:", error);
  } else {
    console.log("✅ SMTP Server ready to send emails");
  }
});

const sendOtpToEmail = async (email, otp) => {
  try {
    if (!email) throw new Error("Email is required");

    const html = `
      <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
        <h2 style="color: #075e54;">🔐 WhatsApp Web Verification</h2>

        <p>Hi there,</p>

        <p>Your one-time password (OTP) to verify your account is:</p>

        <h1 style="
          background: #e0f7fa;
          padding: 10px 20px;
          border-radius: 5px;
          display: inline-block;
          letter-spacing: 2px;">
          ${otp}
        </h1>

        <p><strong>This OTP is valid for 5 minutes.</strong></p>
        <p>Please do not share this code with anyone.</p>

        <p style="margin-top: 20px;">
          Thanks & Regards,<br/>
          Sanjana's chat_app
        </p>

        <hr />
        <small>This is an automated message. Please do not reply.</small>
      </div>
    `;

    await transporter.sendMail({
      from: `"WhatsApp Web" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Your WhatsApp Web Verification OTP",
      html,
    });

    console.log(`✅ OTP sent to ${email}`);
    return true;
  } catch (error) {
    console.error("❌ Email service failed:", error.message);
    throw new Error("Failed to send OTP email");
  }
};

module.exports = {
  sendOtpToEmail,
};
