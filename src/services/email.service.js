import { sendEmail } from "../lib/mail.js";
import { welcomeUserTemplate, passwordResetTemplate, resendVerificationTemplate } from "../lib/emailTemplate.js"


const mailService = {
  sendWelcomeMail: async (user, password) => {
    const htmlBody = welcomeUserTemplate(
      user.fullname,
      user.verificationToken,
      password
    );
    await sendEmail({
      to: user.email,
      subject: "Verify your account",
      html: htmlBody,
    });
  },
    sendVerificationCode: async (user) => {
    const htmlBody = resendVerificationTemplate(
      user.fullname,
      user.verificationToken
    );
    await sendEmail({
      to: user.email,
      subject: "Verify your account",
      html: htmlBody,
    });
  },
  sendPasswordResetEmail: async (user, resetToken) => {
    const htmlBody = passwordResetTemplate(
      user.fullname,
      resetToken
    );
    await sendEmail({
      to: user.email,
      subject: "Reset your password",
      html: htmlBody,
    });
  },
  };

export default mailService;