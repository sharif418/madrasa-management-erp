// Storage Service — File upload/download using admin-configured providers
// Supports: AWS S3, Cloudinary, Local filesystem
import { getActiveIntegration } from "@/lib/integration-config";
import { writeFile, mkdir, unlink } from "fs/promises";
import { join } from "path";

interface UploadParams {
  tenantId: string;
  file: Buffer | Uint8Array;
  fileName: string;
  mimeType: string;
  folder?: string; // e.g. "students", "documents", "website"
}

interface UploadResult {
  success: boolean;
  url: string;
  key: string;
  provider: string;
  error?: string;
}

/**
 * Upload a file using the tenant's configured storage provider.
 * Resolution: DB config → local filesystem.
 */
export async function uploadFile(params: UploadParams): Promise<UploadResult> {
  const config = await getActiveIntegration(params.tenantId, "storage");
  const folder = params.folder || "uploads";

  if (!config || config.provider === "storage_local" || config.isSandbox) {
    return await uploadLocal(params, folder, config?.config?.uploadDir);
  }

  try {
    if (config.provider === "storage_s3") {
      return await uploadToS3(params, config.config, folder);
    }
    if (config.provider === "storage_cloudinary") {
      return await uploadToCloudinary(params, config.config, folder);
    }
    return await uploadLocal(params, folder);
  } catch (e) {
    console.error(`[STORAGE] Upload failed, falling back to local:`, e);
    return await uploadLocal(params, folder);
  }
}

// ─── Local filesystem storage ────────────────────────
async function uploadLocal(
  params: UploadParams,
  folder: string,
  baseDir?: string
): Promise<UploadResult> {
  const uploadDir = baseDir || join(process.cwd(), "public", "uploads");
  const dir = join(uploadDir, params.tenantId, folder);
  await mkdir(dir, { recursive: true });

  const safeName = `${Date.now()}-${params.fileName.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const filePath = join(dir, safeName);
  await writeFile(filePath, params.file);

  const url = `/uploads/${params.tenantId}/${folder}/${safeName}`;
  return { success: true, url, key: filePath, provider: "local" };
}

// ─── AWS S3 ────────────────────────
async function uploadToS3(
  params: UploadParams,
  config: Record<string, string>,
  folder: string
): Promise<UploadResult> {
  const { accessKeyId, secretAccessKey, bucket, region, endpoint } = config;
  const key = `${params.tenantId}/${folder}/${Date.now()}-${params.fileName}`;

  // Use S3-compatible PUT request (works with AWS S3 and MinIO)
  const host = endpoint || `https://${bucket}.s3.${region || "us-east-1"}.amazonaws.com`;
  const url = `${host}/${key}`;

  // Simple unsigned PUT (for S3 with public-write or pre-signed)
  // For production, use @aws-sdk/client-s3
  try {
    const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
    const client = new S3Client({
      region: region || "us-east-1",
      credentials: { accessKeyId, secretAccessKey },
      ...(endpoint ? { endpoint, forcePathStyle: true } : {}),
    });

    await client.send(new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: params.file,
      ContentType: params.mimeType,
    }));

    const publicUrl = endpoint
      ? `${endpoint}/${bucket}/${key}`
      : `https://${bucket}.s3.${region || "us-east-1"}.amazonaws.com/${key}`;

    return { success: true, url: publicUrl, key, provider: "s3" };
  } catch (e) {
    // AWS SDK not installed — fall back
    console.warn("[STORAGE] @aws-sdk/client-s3 not installed. Install with: npm install @aws-sdk/client-s3");
    return await uploadLocal(params, folder);
  }
}

// ─── Cloudinary ────────────────────────
async function uploadToCloudinary(
  params: UploadParams,
  config: Record<string, string>,
  folder: string
): Promise<UploadResult> {
  const { cloudName, apiKey, apiSecret } = config;
  const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;

  const base64Data = Buffer.from(params.file).toString("base64");
  const dataUri = `data:${params.mimeType};base64,${base64Data}`;

  // Generate signature
  const timestamp = Math.floor(Date.now() / 1000);
  const signString = `folder=${params.tenantId}/${folder}&timestamp=${timestamp}${apiSecret}`;
  const crypto = await import("crypto");
  const signature = crypto.createHash("sha1").update(signString).digest("hex");

  const formData = new URLSearchParams({
    file: dataUri,
    api_key: apiKey,
    timestamp: timestamp.toString(),
    signature,
    folder: `${params.tenantId}/${folder}`,
    public_id: `${Date.now()}-${params.fileName.replace(/\.[^.]+$/, "")}`,
  });

  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formData.toString(),
  });

  const data = await response.json();

  if (data.secure_url) {
    return { success: true, url: data.secure_url, key: data.public_id, provider: "cloudinary" };
  }

  return { success: false, url: "", key: "", provider: "cloudinary", error: data.error?.message || "Upload failed" };
}

/**
 * Delete a file (local only for now).
 */
export async function deleteFile(key: string): Promise<boolean> {
  try {
    if (key.startsWith("/") || key.includes("public/uploads")) {
      const fullPath = key.startsWith("/") ? join(process.cwd(), "public", key) : key;
      await unlink(fullPath);
      return true;
    }
    // S3/Cloudinary deletion would go here
    return false;
  } catch {
    return false;
  }
}
