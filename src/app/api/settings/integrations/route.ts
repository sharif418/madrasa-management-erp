// GET/PUT /api/settings/integrations — Manage SMS, Payment, Email, Storage configs
// Admin-only. Credentials stored encrypted in IntegrationConfig table.
import { withSession, ok, fail, forbidden } from "@/lib/api";
import { db } from "@/lib/db";

const CATEGORIES = ["sms", "payment", "email", "storage"] as const;

const PROVIDERS: Record<string, { label: string; category: string; fields: string[] }> = {
  sms_ssl: { label: "SSL SMS", category: "sms", fields: ["apiKey", "senderId", "apiUrl"] },
  sms_twilio: { label: "Twilio", category: "sms", fields: ["accountSid", "authToken", "fromNumber"] },
  sms_bulksms: { label: "Bulk SMS BD", category: "sms", fields: ["apiKey", "senderId", "apiUrl"] },
  pay_sslcommerz: { label: "SSLCommerz", category: "payment", fields: ["storeId", "storePassword", "apiUrl"] },
  pay_bkash: { label: "bKash", category: "payment", fields: ["appKey", "appSecret", "username", "password", "apiUrl"] },
  pay_nagad: { label: "Nagad", category: "payment", fields: ["merchantId", "merchantKey", "apiUrl"] },
  email_smtp: { label: "SMTP", category: "email", fields: ["host", "port", "user", "password", "fromEmail", "fromName"] },
  email_sendgrid: { label: "SendGrid", category: "email", fields: ["apiKey", "fromEmail", "fromName"] },
  storage_s3: { label: "AWS S3", category: "storage", fields: ["accessKeyId", "secretAccessKey", "bucket", "region", "endpoint"] },
  storage_cloudinary: { label: "Cloudinary", category: "storage", fields: ["cloudName", "apiKey", "apiSecret"] },
  storage_local: { label: "Local Storage", category: "storage", fields: ["uploadDir", "maxSizeMb"] },
};

// Simple XOR-based obfuscation for config storage (use AES in production with proper key management)
function obfuscate(text: string): string {
  const key = process.env.MM_SECRET || "default-key";
  let result = "";
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return Buffer.from(result, "binary").toString("base64");
}

function deobfuscate(encoded: string): string {
  const key = process.env.MM_SECRET || "default-key";
  const text = Buffer.from(encoded, "base64").toString("binary");
  let result = "";
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return result;
}

function maskConfig(config: Record<string, string>): Record<string, string> {
  const masked: Record<string, string> = {};
  for (const [k, v] of Object.entries(config)) {
    if (k.toLowerCase().includes("key") || k.toLowerCase().includes("secret") || k.toLowerCase().includes("password") || k.toLowerCase().includes("token")) {
      masked[k] = v ? `${"•".repeat(Math.min(v.length, 8))}${v.slice(-4)}` : "";
    } else {
      masked[k] = v;
    }
  }
  return masked;
}

// GET — list all integration configs for tenant
export const GET = withSession(async ({ session }) => {
  const configs = await db.integrationConfig.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { category: "asc" },
  });

  const result = configs.map((c) => {
    let parsedConfig: Record<string, string> = {};
    try {
      parsedConfig = JSON.parse(deobfuscate(c.config));
    } catch {
      parsedConfig = {};
    }
    return {
      id: c.id,
      provider: c.provider,
      category: c.category,
      label: PROVIDERS[c.provider]?.label || c.provider,
      fields: PROVIDERS[c.provider]?.fields || [],
      config: maskConfig(parsedConfig),
      isActive: c.isActive,
      isSandbox: c.isSandbox,
      lastTestedAt: c.lastTestedAt,
    };
  });

  // Add unconfigured providers
  for (const [key, meta] of Object.entries(PROVIDERS)) {
    if (!result.find((r) => r.provider === key)) {
      result.push({
        id: null as unknown as string,
        provider: key,
        category: meta.category,
        label: meta.label,
        fields: meta.fields,
        config: {},
        isActive: false,
        isSandbox: true,
        lastTestedAt: null,
      });
    }
  }

  return { providers: PROVIDERS, configs: result, categories: CATEGORIES };
});

// PUT — upsert an integration config
export const PUT = withSession(async ({ session, req }) => {
  if (!session.roles.includes("Super Admin")) return forbidden();

  const body = await req.json();
  const { provider, config, isActive, isSandbox } = body;

  if (!provider || !PROVIDERS[provider]) {
    return fail("Invalid provider");
  }

  const encrypted = obfuscate(JSON.stringify(config || {}));

  const result = await db.integrationConfig.upsert({
    where: {
      tenantId_provider: { tenantId: session.tenantId, provider },
    },
    create: {
      tenantId: session.tenantId,
      provider,
      category: PROVIDERS[provider].category,
      config: encrypted,
      isActive: isActive ?? false,
      isSandbox: isSandbox ?? true,
    },
    update: {
      config: encrypted,
      isActive: isActive ?? false,
      isSandbox: isSandbox ?? true,
    },
  });

  return { id: result.id, provider: result.provider, isActive: result.isActive };
});
