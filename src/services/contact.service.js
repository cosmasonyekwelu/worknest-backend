import { sendEmail } from "../lib/mail.js";

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");

const contactMailService = {
  sendContactMessage: async ({ fullName, email, subject, message }) => {
    const safeFullName = escapeHtml(fullName);
    const safeEmail = escapeHtml(email);
    const safeSubject = escapeHtml(subject);
    const safeMessage = escapeHtml(message);

    const htmlBody = `
      <h2>New Contact Form Submission</h2>
      <p><strong>Name:</strong> ${safeFullName}</p>
      <p><strong>Email:</strong> ${safeEmail}</p>
      <p><strong>Subject:</strong> ${safeSubject}</p>
      <p><strong>Message:</strong></p>
      <p>${safeMessage}</p>
    `;

    return sendEmail({
      to: process.env.BREVO_SENDER_EMAIL,
      subject: `Contact Form: ${safeSubject}`,
      html: htmlBody,
    });
  },

  sendAutoReply: async ({ fullName, email }) => {
    const safeFullName = escapeHtml(fullName);

    const htmlBody = `
      <p>Hi ${safeFullName},</p>
      <p>Thank you for reaching out to us. We have received your message and will get back to you soon.</p>
      <p>— Worknest Team</p>
    `;

    return sendEmail({
      to: email,
      subject: "We received your message",
      html: htmlBody,
    });
  },
};

export default contactMailService;
