import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const PORT = parseInt(process.env.EMAIL_PORT, 10);

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: PORT,
  secure: PORT === 465, // ✅ Only true for 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// Verify email service connection
const verifyEmailConnection = async () => {
  try {
    await transporter.verify();
    console.log("✅ Email service connection verified");
  } catch (error) {
    console.error("❌ Failed to connect to email service", {
      message: error.message,
      code: error.code,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

// Only verify in development (optional but recommended)
if (process.env.NODE_ENV === "development") {
  verifyEmailConnection();
}

export const sendEmail = async ({ to, subject, html }) => {
  try {
    await transporter.sendMail({
      from: `"Worknest" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    console.log("✅ Email sent successfully");
  } catch (error) {
    console.error("❌ Error sending email:", error.message);
    throw error;
  }
};
