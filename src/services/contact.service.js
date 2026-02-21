import { sendEmail } from "../lib/mail.js";

const contactMailService = {
  sendContactMessage: async ({ fullName, email, subject, message }) => {
    const htmlBody = `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${fullName}</p>
       <p><strong>Email:</strong> ${email}</p>
       <p><strong>Subject:</strong> ${subject}</p>
       <p><strong>Message:</strong></p>
       <p>${message}</p>
        `;

    const info = await sendEmail({
      to: process.env.EMAIL_USER,
      subject: `Contact Form: ${subject}`,
      html: htmlBody,
    });
    return info;
  },

  sendAutoReply: async ({ fullName, email }) => {
    const htmlBody = `
    <p>Hi ${fullName},</p>
    <p>Thank you for reaching out to us. We have received your message and will get back to you soon</p>
    <p>— Worknest Team</p>
    `;

    const info = await sendEmail({
      to: email,
      subject: "We received your message",
      html: htmlBody,
    });
    return info;
  },
};
console.log("Sending contact message to:", process.env.EMAIL_USER);

export default contactMailService;
