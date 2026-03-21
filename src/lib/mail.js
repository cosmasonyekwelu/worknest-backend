import logger from "../config/logger.js";

// brevoEmail.js (ESM)
// Switches Nodemailer -> Brevo Transactional Email API (REST)
//
// Docs:
// - POST /v3/smtp/email (send transactional email)  https://api.brevo.com/v3/smtp/email :contentReference[oaicite:1]{index=1}
// - GET  /v3/account   (validate API key / account info) :contentReference[oaicite:2]{index=2}

const BREVO_BASE_URL = "https://api.brevo.com/v3";

const BREVO_API_KEY = process.env.BREVO_API_KEY;

// Prefer a verified sender/domain in Brevo (recommended for deliverability).
const DEFAULT_SENDER = {
  email: process.env.BREVO_SENDER_EMAIL,
  name: process.env.BREVO_SENDER_NAME,
};

let emailVerified = false;
let verifyInFlight = null;

function redactError(err) {
  return {
    message: err?.message,
    name: err?.name,
    code: err?.code,
    status: err?.status,
  };
}

async function getFetch() {
  // Node 18+ has global fetch. If you’re on Node < 18, install node-fetch:
  //   npm i node-fetch
  if (typeof globalThis.fetch === "function")
    return globalThis.fetch.bind(globalThis);
  const mod = await import("node-fetch");
  return mod.default;
}

async function requestBrevo(
  path,
  { method = "GET", body, timeoutMs = 15000 } = {},
) {
  if (!BREVO_API_KEY) {
    throw new Error("Missing BREVO_API_KEY in environment variables");
  }

  const fetch = await getFetch();
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${BREVO_BASE_URL}${path}`, {
      method,
      headers: {
        "api-key": BREVO_API_KEY, // Brevo API key header :contentReference[oaicite:3]{index=3}
        Accept: "application/json",
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    const text = await res.text();
    const data = text ? safeJsonParse(text) : null;

    if (!res.ok) {
      const err = new Error(
        `Brevo request failed: ${res.status} ${res.statusText}`,
      );
      err.status = res.status;
      err.body = data ?? text;
      throw err;
    }

    return data;
  } finally {
    clearTimeout(t);
  }
}

function safeJsonParse(str) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

function normalizeRecipients(to) {
  if (!to) throw new Error("Missing 'to'");

  // Accept:
  // - "user@example.com"
  // - ["a@x.com", "b@y.com"]
  // - [{ email: "a@x.com", name: "A" }, ...]
  if (typeof to === "string") return [{ email: to }];

  if (Array.isArray(to)) {
    return to.map((item) => {
      if (typeof item === "string") return { email: item };
      if (item && typeof item === "object" && item.email)
        return { email: item.email, name: item.name };
      throw new Error(
        "Invalid recipient in 'to' array. Use string emails or {email,name} objects.",
      );
    });
  }

  if (typeof to === "object" && to.email)
    return [{ email: to.email, name: to.name }];

  throw new Error("Invalid 'to' format");
}

// Verify email service connection (validates API key / account access)
export async function verifyEmailConnection() {
  if (emailVerified) return;

  if (verifyInFlight) {
    await verifyInFlight;
    return;
  }

  verifyInFlight = (async () => {
    try {
      // GET /v3/account validates your API key and returns account details :contentReference[oaicite:4]{index=4}
      await requestBrevo("/account", { method: "GET" });
      emailVerified = true;
      logger.info("Brevo email service connection verified");
    } catch (error) {
      logger.error("Failed to connect to Brevo email service", {
        error: redactError(error),
        // In dev you can inspect error.body if needed, but be careful not to log secrets.
        body: process.env.NODE_ENV === "development" ? error?.body : undefined,
      });
      throw new Error("Brevo email service connection failed");
    } finally {
      verifyInFlight = null;
    }
  })();

  await verifyInFlight;
}

// Send email via Brevo Transactional Email API
export async function sendEmail({
  to,
  subject,
  html,
  text, // optional
  sender, // optional override: {email,name}
  replyTo, // optional: {email,name}
  tags, // optional: ["worknest", "password-reset"]
  headers, // optional custom headers object
} = {}) {
  await verifyEmailConnection();

  if (!subject) throw new Error("Missing 'subject'");
  if (!html && !text)
    throw new Error("Provide at least one of 'html' or 'text'");

  const payload = {
    sender: sender?.email ? sender : DEFAULT_SENDER,
    to: normalizeRecipients(to),
    subject,
    ...(html ? { htmlContent: html } : {}),
    ...(text ? { textContent: text } : {}),
    ...(replyTo?.email ? { replyTo } : {}),
    ...(Array.isArray(tags) && tags.length ? { tags } : {}),
    ...(headers && typeof headers === "object" ? { headers } : {}),
  };

  try {
    // POST /v3/smtp/email sends the transactional email :contentReference[oaicite:5]{index=5}
    const res = await requestBrevo("/smtp/email", {
      method: "POST",
      body: payload,
    });
    return res; // usually includes { messageId } :contentReference[oaicite:6]{index=6}
  } catch (error) {
    logger.error("Error sending email (Brevo)", {
      error: redactError(error),
      body: process.env.NODE_ENV === "development" ? error?.body : undefined,
    });
    throw error;
  }
}

// (Optional) Verify on startup, non-blocking:
// verifyEmailConnection()
//   .then(() => console.log("✅ Brevo email service ready"))
//   .catch((err) => console.warn("⚠️ Brevo email service unavailable at startup:", err.message));
