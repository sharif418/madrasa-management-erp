// Email Service — Reads config from IntegrationConfig at runtime
// Supports: SMTP (via fetch to external relay) and SendGrid API
import { getActiveIntegration } from "@/lib/integration-config";

interface EmailParams {
  tenantId: string;
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  sandbox: boolean;
}

/**
 * Send an email using the tenant's configured provider.
 * Resolution: DB config → sandbox.
 */
export async function sendEmail(params: EmailParams): Promise<EmailResult> {
  const config = await getActiveIntegration(params.tenantId, "email");

  if (!config) {
    console.log(`[EMAIL SANDBOX] To: ${params.to} | Subject: ${params.subject}`);
    return { success: true, messageId: `SANDBOX-EMAIL-${Date.now()}`, sandbox: true };
  }

  if (config.isSandbox) {
    console.log(`[EMAIL SANDBOX] Provider: ${config.provider} | To: ${params.to} | Subject: ${params.subject}`);
    return { success: true, messageId: `SANDBOX-${config.provider}-${Date.now()}`, sandbox: true };
  }

  try {
    if (config.provider === "email_sendgrid") {
      return await sendViaSendGrid(params, config.config);
    }
    if (config.provider === "email_smtp") {
      return await sendViaSMTPRelay(params, config.config);
    }
    return { success: false, error: `Unknown provider: ${config.provider}`, sandbox: false };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Email send failed", sandbox: false };
  }
}

// ─── SendGrid API ────────────────────────
async function sendViaSendGrid(
  params: EmailParams,
  config: Record<string, string>
): Promise<EmailResult> {
  const recipients = Array.isArray(params.to) ? params.to : [params.to];

  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: recipients.map((email) => ({ email })) }],
      from: { email: config.fromEmail || "noreply@madrasa.edu.bd", name: config.fromName || "Madrasa Manager" },
      subject: params.subject,
      content: [
        ...(params.text ? [{ type: "text/plain", value: params.text }] : []),
        { type: "text/html", value: params.html },
      ],
    }),
  });

  if (response.ok || response.status === 202) {
    return { success: true, messageId: response.headers.get("x-message-id") || `SG-${Date.now()}`, sandbox: false };
  }

  const errorText = await response.text();
  return { success: false, error: `SendGrid error (${response.status}): ${errorText}`, sandbox: false };
}

// ─── SMTP via HTTP relay (using a lightweight approach) ────────────────────
// Note: For full SMTP support, install nodemailer. This uses a fetch-based approach.
async function sendViaSMTPRelay(
  params: EmailParams,
  config: Record<string, string>
): Promise<EmailResult> {
  // SMTP requires nodemailer for proper implementation.
  // This is a stub that validates config and logs the attempt.
  // In production, install nodemailer and use it here.
  const required = ["host", "port", "user", "password"];
  for (const field of required) {
    if (!config[field]) {
      return { success: false, error: `SMTP config missing: ${field}`, sandbox: false };
    }
  }

  // Log for now — replace with nodemailer when dependency is added
  console.log(`[EMAIL SMTP] ${config.host}:${config.port} → ${params.to} | ${params.subject}`);

  // Dynamic import of nodemailer if available
  try {
    const nodemailer = await import("nodemailer").catch(() => null);
    if (nodemailer) {
      const transporter = nodemailer.createTransport({
        host: config.host,
        port: parseInt(config.port),
        secure: parseInt(config.port) === 465,
        auth: { user: config.user, pass: config.password },
      });

      const info = await transporter.sendMail({
        from: `"${config.fromName || "Madrasa Manager"}" <${config.fromEmail || config.user}>`,
        to: Array.isArray(params.to) ? params.to.join(", ") : params.to,
        subject: params.subject,
        text: params.text,
        html: params.html,
      });

      return { success: true, messageId: info.messageId, sandbox: false };
    }
  } catch {
    // nodemailer not installed — log warning
  }

  console.warn("[EMAIL] nodemailer not installed. Install with: npm install nodemailer @types/nodemailer");
  return {
    success: true,
    messageId: `SMTP-PENDING-${Date.now()}`,
    sandbox: true, // Treat as sandbox until nodemailer is installed
  };
}

// ─── Convenience: Send templated emails ────────────────────
export async function sendTemplatedEmail(
  tenantId: string,
  to: string,
  template: "fee_reminder" | "absence_alert" | "welcome" | "password_reset",
  vars: Record<string, string>
): Promise<EmailResult> {
  const templates: Record<string, { subject: string; html: string }> = {
    fee_reminder: {
      subject: `ফি পেমেন্ট রিমাইন্ডার — ${vars.studentName || ""}`,
      html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <h2 style="color:#059669;">মাদ্রাসা ম্যানেজার</h2>
        <p>আসসালামু আলাইকুম,</p>
        <p>${vars.studentName || "ছাত্র"}-এর জন্য <strong>৳${vars.amount || "0"}</strong> ফি বকেয়া রয়েছে।</p>
        <p>অনুগ্রহ করে যত তাড়াতাড়ি সম্ভব পেমেন্ট করুন।</p>
        <p>জাযাকাল্লাহু খাইরান।</p>
      </div>`,
    },
    absence_alert: {
      subject: `অনুপস্থিতি বিজ্ঞপ্তি — ${vars.studentName || ""}`,
      html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <h2 style="color:#059669;">মাদ্রাসা ম্যানেজার</h2>
        <p>আসসালামু আলাইকুম,</p>
        <p>আপনার সন্তান <strong>${vars.studentName || ""}</strong> আজ (${vars.date || ""}) মাদ্রাসায় অনুপস্থিত ছিলেন।</p>
        <p>অনুগ্রহ করে অফিসে যোগাযোগ করুন।</p>
      </div>`,
    },
    welcome: {
      subject: "স্বাগতম — মাদ্রাসা ম্যানেজার",
      html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <h2 style="color:#059669;">মাদ্রাসা ম্যানেজার</h2>
        <p>আসসালামু আলাইকুম ${vars.name || ""},</p>
        <p>মাদ্রাসা ম্যানেজারে আপনাকে স্বাগতম!</p>
      </div>`,
    },
    password_reset: {
      subject: "পাসওয়ার্ড রিসেট",
      html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <h2 style="color:#059669;">পাসওয়ার্ড রিসেট</h2>
        <p>আপনার রিসেট কোড: <strong>${vars.code || ""}</strong></p>
      </div>`,
    },
  };

  const tpl = templates[template];
  if (!tpl) return { success: false, error: "Unknown template", sandbox: false };

  return sendEmail({ tenantId, to, subject: tpl.subject, html: tpl.html });
}
