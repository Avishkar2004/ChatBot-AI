import logger from "./logger.js";

/**
 * Minimal transactional mailer.
 *
 * Uses Resend's HTTP API when RESEND_API_KEY is set (no extra dependency — it
 * is a plain POST). Without a provider configured, mail is written to the log
 * instead so password reset is fully usable in development and self-hosting
 * without silently pretending to have sent anything.
 */

const isConfigured = () => Boolean(process.env.RESEND_API_KEY);

export const mailerStatus = () =>
  isConfigured() ? "resend" : "log-only (set RESEND_API_KEY to send real mail)";

export const sendMail = async ({ to, subject, text, html }) => {
  if (!isConfigured()) {
    // The body is deliberately not logged here: a wrapped JSON blob is a
    // terrible place to copy a link out of. Callers surface what matters.
    logger.warn("email_not_sent_no_provider", {
      to,
      subject,
      fix: "set RESEND_API_KEY and MAIL_FROM to deliver this for real",
    });
    return { delivered: false, reason: "no_provider", preview: { to, subject, text } };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.MAIL_FROM || "onboarding@resend.dev",
        to: [to],
        subject,
        text,
        ...(html ? { html } : {}),
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      logger.error("email_send_failed", {
        to,
        subject,
        status: response.status,
        detail: detail.slice(0, 500),
      });
      return { delivered: false, reason: `provider_${response.status}` };
    }

    logger.info("email_sent", { to, subject });
    return { delivered: true };
  } catch (err) {
    logger.error("email_send_error", { err, to, subject });
    return { delivered: false, reason: "exception" };
  }
};

export default { sendMail, mailerStatus };
