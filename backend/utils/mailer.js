import nodemailer from "nodemailer";

const transporter =
  process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD
    ? nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD,
        },
      })
    : null;

// Email is best-effort: a failure here should never break the ticket/agent/
// signup action that triggered it, so this always resolves and only logs.
export async function sendMail({ to, subject, html }) {
  if (!transporter) {
    console.warn(
      `[mailer] Email not sent (GMAIL_USER / GMAIL_APP_PASSWORD not configured) — would have sent "${subject}" to ${to}`
    );
    return;
  }

  try {
    await transporter.sendMail({
      from: `"SupportFlow" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error(`[mailer] Failed to send email to ${to}:`, err.message);
  }
}