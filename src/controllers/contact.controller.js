import tryCatchFn from "../lib/tryCatchFn.js";
import contactMailService from "../services/contact.service.js";
import responseHandler from "../lib/responseHandler.js";

const { successResponse } = responseHandler;

const sendContactMail = tryCatchFn(async (req, res) => {
  const { fullName, email, subject, message } = req.body;

  await contactMailService.sendContactMessage({
    fullName,
    email,
    subject,
    message,
  });

  await contactMailService.sendAutoReply({ fullName, email });
  return successResponse(res, null, "Email sent successfully!", 200);
});

export { sendContactMail };
