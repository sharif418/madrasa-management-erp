// Integration Config Loader — Runtime credential resolution from database
// Instead of reading process.env at module load time, this reads
// encrypted credentials from the IntegrationConfig table per-tenant.
import { db } from "@/lib/db";

const MM_SECRET = process.env.MM_SECRET || "default-key";

function deobfuscate(encoded: string): string {
  const text = Buffer.from(encoded, "base64").toString("binary");
  let result = "";
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(
      text.charCodeAt(i) ^ MM_SECRET.charCodeAt(i % MM_SECRET.length)
    );
  }
  return result;
}

export type IntegrationCategory = "sms" | "payment" | "email" | "storage";

export interface ResolvedConfig {
  provider: string;
  config: Record<string, string>;
  isActive: boolean;
  isSandbox: boolean;
}

/**
 * Get the active integration config for a tenant + category.
 * Returns null if no active provider is configured.
 */
export async function getActiveIntegration(
  tenantId: string,
  category: IntegrationCategory
): Promise<ResolvedConfig | null> {
  const integration = await db.integrationConfig.findFirst({
    where: { tenantId, category, isActive: true },
  });

  if (!integration) return null;

  let config: Record<string, string> = {};
  try {
    config = JSON.parse(deobfuscate(integration.config));
  } catch {
    console.error(`[IntegrationConfig] Failed to decrypt config for ${integration.provider}`);
    return null;
  }

  return {
    provider: integration.provider,
    config,
    isActive: integration.isActive,
    isSandbox: integration.isSandbox,
  };
}

/**
 * Get a specific provider's config.
 */
export async function getProviderConfig(
  tenantId: string,
  provider: string
): Promise<ResolvedConfig | null> {
  const integration = await db.integrationConfig.findUnique({
    where: { tenantId_provider: { tenantId, provider } },
  });

  if (!integration) return null;

  let config: Record<string, string> = {};
  try {
    config = JSON.parse(deobfuscate(integration.config));
  } catch {
    return null;
  }

  return {
    provider: integration.provider,
    config,
    isActive: integration.isActive,
    isSandbox: integration.isSandbox,
  };
}
