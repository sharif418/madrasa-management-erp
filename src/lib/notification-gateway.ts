// WhatsApp Business API + SMS Gateway Integration
// Now reads credentials from IntegrationConfig (admin dashboard) at runtime.
// Falls back to process.env for backward compatibility, then to sandbox mode.

import { getActiveIntegration } from "@/lib/integration-config";

export type NotificationChannel = "APP" | "SMS" | "WHATSAPP";
export type NotificationAudience = "ALL" | "PARENTS" | "STAFF" | "STUDENTS";

interface SendParams {
  to: string;
  message: string;
  channel: NotificationChannel;
  tenantId: string; // Required for DB config lookup
  templateName?: string;
  templateParams?: string[];
}

interface SendResult {
  success: boolean;
  channel: NotificationChannel;
  messageId?: string;
  error?: string;
  sandbox: boolean;
}

/**
 * Resolve SMS/WhatsApp credentials — first from DB, then from env, then sandbox.
 */
async function resolveCredentials(tenantId: string, channel: NotificationChannel) {
  // 1. Try database (admin-configured)
  if (channel === "WHATSAPP") {
    // No dedicated WhatsApp provider in our config yet — try SMS providers
    // that support WhatsApp (like Twilio)
    const twilio = await getActiveIntegration(tenantId, "sms");
    if (twilio && twilio.provider === "sms_twilio") {
      return {
        sandbox: twilio.isSandbox,
        type: "twilio" as const,
        accountSid: twilio.config.accountSid || "",
        authToken: twilio.config.authToken || "",
        fromNumber: twilio.config.fromNumber || "",
      };
    }
    // Fallback to env
    const envToken = process.env.WHATSAPP_TOKEN || "";
    const envPhoneId = process.env.WHATSAPP_PHONE_ID || "";
    if (envToken) {
      return { sandbox: false, type: "meta" as const, token: envToken, phoneId: envPhoneId };
    }
    return { sandbox: true, type: "none" as const };
  }

  if (channel === "SMS") {
    const smsConfig = await getActiveIntegration(tenantId, "sms");
    if (smsConfig) {
      return {
        sandbox: smsConfig.isSandbox,
        type: smsConfig.provider as string,
        apiKey: smsConfig.config.apiKey || "",
        senderId: smsConfig.config.senderId || "MADARIS",
        apiUrl: smsConfig.config.apiUrl || "",
        // Twilio specific
        accountSid: smsConfig.config.accountSid || "",
        authToken: smsConfig.config.authToken || "",
        fromNumber: smsConfig.config.fromNumber || "",
      };
    }
    // Fallback to env
    const envKey = process.env.SMS_API_KEY || "";
    if (envKey) {
      return {
        sandbox: process.env.NOTIFICATION_SANDBOX === "true",
        type: "sms_ssl" as const,
        apiKey: envKey,
        senderId: process.env.SMS_SENDER_ID || "MADARIS",
        apiUrl: "",
        accountSid: "", authToken: "", fromNumber: "",
      };
    }
    return { sandbox: true, type: "none" as const };
  }

  return { sandbox: true, type: "none" as const };
}

/**
 * Send a message via WhatsApp or SMS.
 * Credentials are resolved from DB → env → sandbox (in that order).
 */
export async function sendMessage(params: SendParams): Promise<SendResult> {
  const { to, message, channel, tenantId, templateName, templateParams } = params;

  const normalizedPhone = normalizePhone(to);
  if (!normalizedPhone) {
    return { success: false, channel, error: "Invalid phone number", sandbox: false };
  }

  const creds = await resolveCredentials(tenantId, channel);

  if (creds.sandbox || creds.type === "none") {
    console.log(`[NOTIFICATION SANDBOX] ${channel} → ${normalizedPhone}: ${message.substring(0, 80)}...`);
    return {
      success: true, channel,
      messageId: `SANDBOX-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      sandbox: true,
    };
  }

  try {
    if (channel === "WHATSAPP" && creds.type === "meta") {
      return await sendWhatsAppMeta(normalizedPhone, message, (creds as any).token, (creds as any).phoneId, templateName, templateParams);
    } else if (channel === "SMS") {
      if (creds.type === "sms_ssl" || creds.type === "sms_bulksms") {
        return await sendSMSSSL(normalizedPhone, message, (creds as any).apiKey, (creds as any).senderId, (creds as any).apiUrl);
      } else if (creds.type === "sms_twilio") {
        return await sendSMSTwilio(normalizedPhone, message, (creds as any).accountSid, (creds as any).authToken, (creds as any).fromNumber);
      }
    }
    return { success: false, channel, error: "Unsupported provider", sandbox: false };
  } catch (error) {
    return {
      success: false, channel,
      error: error instanceof Error ? error.message : "Unknown error",
      sandbox: false,
    };
  }
}

// ─── WhatsApp via Meta Business API ────────────────────────
async function sendWhatsAppMeta(
  phone: string, message: string, token: string, phoneId: string,
  templateName?: string, templateParams?: string[]
): Promise<SendResult> {
  const url = `https://graph.facebook.com/v18.0/${phoneId}/messages`;
  const body: Record<string, unknown> = { messaging_product: "whatsapp", to: phone };

  if (templateName) {
    body.type = "template";
    body.template = {
      name: templateName, language: { code: "en" },
      components: templateParams
        ? [{ type: "body", parameters: templateParams.map((p) => ({ type: "text", text: p })) }]
        : undefined,
    };
  } else {
    body.type = "text";
    body.text = { body: message };
  }

  const response = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json();

  if (data.messages?.[0]?.id) {
    return { success: true, channel: "WHATSAPP", messageId: data.messages[0].id, sandbox: false };
  }
  return { success: false, channel: "WHATSAPP", error: data.error?.message || "WhatsApp send failed", sandbox: false };
}

// ─── SMS via SSL Wireless ────────────────────────
async function sendSMSSSL(
  phone: string, message: string, apiKey: string, senderId: string, apiUrl?: string
): Promise<SendResult> {
  const url = apiUrl || "https://smsplus.sslwireless.com/api/v3/send-sms";
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_token: apiKey, sid: senderId, msisdn: phone,
      sms: message, csms_id: `MAD-${Date.now()}`,
    }),
  });
  const data = await response.json();

  if (data.status === "SUCCESS" || response.ok) {
    return { success: true, channel: "SMS", messageId: `SMS-${Date.now()}`, sandbox: false };
  }
  return { success: false, channel: "SMS", error: JSON.stringify(data), sandbox: false };
}

// ─── SMS via Twilio ────────────────────────
async function sendSMSTwilio(
  phone: string, message: string, accountSid: string, authToken: string, fromNumber: string
): Promise<SendResult> {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

  const response = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ To: `+${phone}`, From: fromNumber, Body: message }).toString(),
  });
  const data = await response.json();

  if (data.sid) {
    return { success: true, channel: "SMS", messageId: data.sid, sandbox: false };
  }
  return { success: false, channel: "SMS", error: data.message || "Twilio failed", sandbox: false };
}

// ─── Phone normalization ────────────────────────
function normalizePhone(phone: string): string | null {
  let p = phone.replace(/[^0-9]/g, "");
  if (p.startsWith("0")) p = "880" + p.substring(1);
  else if (p.length === 10 && p.startsWith("1")) p = "880" + p;
  if (!/^8801[3-9]\d{8}$/.test(p)) return null;
  return p;
}

// ─── Message templates ────────────────────────
export const MESSAGE_TEMPLATES = {
  ABSENCE_ALERT: {
    whatsapp: "madrasa_absence_alert",
    sms: "Assalamu Alaikum, your child {name} was absent from madrasa today ({date}). Please contact the office. - {madrasa}",
  },
  FEE_REMINDER: {
    whatsapp: "madrasa_fee_reminder",
    sms: "Assalamu Alaikum, fee payment of BDT {amount} for {name} is due. Please arrange payment. JazakAllah. - {madrasa}",
  },
  EXAM_RESULT: {
    whatsapp: "madrasa_exam_result",
    sms: "Assalamu Alaikum, {name}'s exam results have been published. Average: {percent}%. Check the parent portal. - {madrasa}",
  },
  GATE_PASS: {
    whatsapp: "madrasa_gate_pass",
    sms: "Assalamu Alaikum, gate pass approved for {name}. Student will leave at {time}. - {madrasa}",
  },
  GENERAL: {
    sms: "{message} - {madrasa}",
  },
} as const;

/**
 * Send a templated notification to a parent.
 */
export async function sendTemplatedNotification(
  template: keyof typeof MESSAGE_TEMPLATES,
  params: Record<string, string>,
  phone: string,
  tenantId: string,
  channel: NotificationChannel = "WHATSAPP"
): Promise<SendResult> {
  const tpl = MESSAGE_TEMPLATES[template];
  let message: string;
  let templateName: string | undefined;

  if (channel === "WHATSAPP" && "whatsapp" in tpl) {
    templateName = tpl.whatsapp;
    message = "";
  } else {
    message = tpl.sms.replace(/\{(\w+)\}/g, (_, key) => params[key] || `{${key}}`);
  }

  return sendMessage({ to: phone, message, channel, tenantId, templateName, templateParams: Object.values(params) });
}
