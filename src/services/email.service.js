import { sendEmail } from "../lib/mail.js";
import { welcomeUserTemplate} from "../lib/emailTemplate.js"


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
  };

export default mailService;