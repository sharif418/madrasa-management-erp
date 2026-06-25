// SSLCommerz / bKash / Nagad Payment Gateway Integration
// Now reads credentials from IntegrationConfig (admin dashboard) at runtime.
// Falls back to process.env, then sandbox mode.

import { db } from "@/lib/db";
import { getActiveIntegration } from "@/lib/integration-config";

const SSLCOMMERZ_SANDBOX_URL = "https://sandbox.sslcommerz.com/gwprocess/v4/api.php";
const SSLCOMMERZ_PRODUCTION_URL = "https://securepay.sslcommerz.com/gwprocess/v4/api.php";

interface PaymentInitParams {
  amount: number;
  currency: "BDT" | "USD";
  description: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  referenceId: string;
  successUrl: string;
  failUrl: string;
  cancelUrl: string;
  type: "FEE" | "DONATION";
  studentId?: string;
  fund?: string;
  feeCollectionId?: string;
  tenantId: string; // Required for DB config lookup
}

interface PaymentSession {
  sessionId: string;
  gatewayUrl: string;
  sandbox: boolean;
  referenceId: string;
  amount: number;
}

/**
 * Resolve payment credentials from DB → env → sandbox.
 */
async function resolvePaymentCredentials(tenantId: string) {
  // 1. Try database (admin-configured)
  const payConfig = await getActiveIntegration(tenantId, "payment");
  if (payConfig) {
    if (payConfig.provider === "pay_sslcommerz") {
      return {
        sandbox: payConfig.isSandbox,
        provider: "sslcommerz" as const,
        storeId: payConfig.config.storeId || "",
        storePassword: payConfig.config.storePassword || "",
        apiUrl: payConfig.isSandbox ? SSLCOMMERZ_SANDBOX_URL : SSLCOMMERZ_PRODUCTION_URL,
      };
    }
    if (payConfig.provider === "pay_bkash") {
      return {
        sandbox: payConfig.isSandbox,
        provider: "bkash" as const,
        appKey: payConfig.config.appKey || "",
        appSecret: payConfig.config.appSecret || "",
        username: payConfig.config.username || "",
        password: payConfig.config.password || "",
        apiUrl: payConfig.config.apiUrl || "",
      };
    }
    if (payConfig.provider === "pay_nagad") {
      return {
        sandbox: payConfig.isSandbox,
        provider: "nagad" as const,
        merchantId: payConfig.config.merchantId || "",
        merchantKey: payConfig.config.merchantKey || "",
        apiUrl: payConfig.config.apiUrl || "",
      };
    }
  }

  // 2. Fallback to env
  const envStoreId = process.env.SSLCOMMERZ_STORE_ID || "";
  if (envStoreId) {
    return {
      sandbox: process.env.PAYMENT_SANDBOX === "true",
      provider: "sslcommerz" as const,
      storeId: envStoreId,
      storePassword: process.env.SSLCOMMERZ_STORE_PASSWD || "",
      apiUrl: process.env.PAYMENT_SANDBOX === "true" ? SSLCOMMERZ_SANDBOX_URL : SSLCOMMERZ_PRODUCTION_URL,
    };
  }

  // 3. Sandbox
  return { sandbox: true, provider: "none" as const };
}

/**
 * Initiate a payment session.
 * Credentials are resolved from DB → env → sandbox.
 */
export async function initiatePayment(params: PaymentInitParams): Promise<PaymentSession> {
  const creds = await resolvePaymentCredentials(params.tenantId);

  if (creds.sandbox || creds.provider === "none") {
    const sessionId = `SANDBOX-${Date.now()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    return {
      sessionId,
      gatewayUrl: `/api/payments/sandbox?session=${sessionId}&amount=${params.amount}&ref=${params.referenceId}&opt_a=${params.studentId || ""}&opt_b=${params.fund || ""}&opt_c=${params.feeCollectionId || ""}&opt_d=${params.tenantId || ""}`,
      sandbox: true,
      referenceId: params.referenceId,
      amount: params.amount,
    };
  }

  if (creds.provider === "sslcommerz") {
    return await initiateSSLCommerz(params, creds as any);
  }

  // bKash/Nagad — placeholder for future implementation
  const sessionId = `${creds.provider.toUpperCase()}-${Date.now()}`;
  return {
    sessionId,
    gatewayUrl: `/api/payments/sandbox?session=${sessionId}&amount=${params.amount}&ref=${params.referenceId}`,
    sandbox: true,
    referenceId: params.referenceId,
    amount: params.amount,
  };
}

async function initiateSSLCommerz(
  params: PaymentInitParams,
  creds: { storeId: string; storePassword: string; apiUrl: string }
): Promise<PaymentSession> {
  const formData = new URLSearchParams({
    store_id: creds.storeId,
    store_passwd: creds.storePassword,
    total_amount: params.amount.toString(),
    currency: params.currency,
    tran_id: params.referenceId,
    success_url: params.successUrl,
    fail_url: params.failUrl,
    cancel_url: params.cancelUrl,
    cus_name: params.customerName,
    cus_email: params.customerEmail || "noreply@madrasa.edu.bd",
    cus_phone: params.customerPhone || "0000000000",
    cus_add1: "Bangladesh",
    cus_city: "Dhaka",
    cus_country: "Bangladesh",
    desc: params.description,
    type: params.type,
    product_name: params.description,
    product_category: params.type === "FEE" ? "Education" : "Donation",
    product_profile: "general",
  });

  if (params.studentId) formData.append("opt_a", params.studentId);
  if (params.fund) formData.append("opt_b", params.fund);
  if (params.feeCollectionId) formData.append("opt_c", params.feeCollectionId);
  if (params.tenantId) formData.append("opt_d", params.tenantId);

  const response = await fetch(creds.apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formData.toString(),
  });
  const data = await response.json();

  if (data.status !== "SUCCESS") {
    throw new Error(data.failedreason || "Payment initiation failed");
  }

  return {
    sessionId: data.sessionkey,
    gatewayUrl: data.GatewayPageURL,
    sandbox: false,
    referenceId: params.referenceId,
    amount: params.amount,
  };
}

/**
 * Verify a payment transaction.
 */
export async function verifyPayment(
  transactionId: string,
  amount: number,
  tenantId: string
): Promise<{ verified: boolean; method?: string; gatewayRef?: string }> {
  const creds = await resolvePaymentCredentials(tenantId);

  if (creds.sandbox || creds.provider === "none") {
    const methods = ["bkash", "nagad", "rocket", "visa", "mastercard"];
    return {
      verified: true,
      method: methods[Math.floor(Math.random() * methods.length)],
      gatewayRef: `SANDBOX-VAL-${Date.now()}`,
    };
  }

  if (creds.provider === "sslcommerz") {
    const c = creds as any;
    const baseUrl = c.apiUrl.includes("sandbox") ? "https://sandbox.sslcommerz.com" : "https://securepay.sslcommerz.com";
    const validationUrl = `${baseUrl}/validator/api/validationserverAPI.php?sessionkey=${transactionId}&store_id=${c.storeId}&store_passwd=${c.storePassword}&format=json`;

    const response = await fetch(validationUrl);
    const data = await response.json();

    if (data.status === "VALID" || data.status === "VALIDATED") {
      return { verified: true, method: data.card_type || data.gateway_response, gatewayRef: data.bank_txn };
    }
    return { verified: false };
  }

  return { verified: false };
}
