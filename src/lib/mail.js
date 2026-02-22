import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT, 10),
  secure: false,
  requireTLS: true, //upgrade to a secure conn once connected
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
  tls: {
    //reject unauthorized cert in production, for security
    rejectUnauthorized: false,
  },
});

//verify email service connection
let emailVerified = false;
const verifyEmailConnection = async () => {
  if (!emailVerified) {
    try {
      await transporter.verify();
      emailVerified = true;
      console.log("✅ Email service connection verified");
    } catch (error) {
      console.error("❌ Failed to connect to email service", {
        error: error.message,
        code: error.code,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
      throw new Error("Email service connection failed");
    }
  }
};
// verifyEmailConnection().catch(console.error);

export const sendEmail = async ({ to, subject, html }) => {
  await verifyEmailConnection();
  const mailOptions = {
    from: "Worknest <worknestnig@gmail.com>",
    to,
    subject,
    html,
  };
  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

// Verify in background, non-blocking
// verifyEmailConnection()
//   .then(() => console.log("✅ Email service ready"))
//   .catch(err => console.warn("⚠️  Email service unavailable at startup:", err.message));
