import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96-bit nonce for GCM

function getKey(): Buffer {
  const keyB64 = process.env.MONGODB_ENCRYPTION_KEY;
  if (!keyB64) {
    throw new Error("MONGODB_ENCRYPTION_KEY is not set");
  }
  const key = Buffer.from(keyB64, "base64");
  if (key.length !== 32) {
    throw new Error("MONGODB_ENCRYPTION_KEY must be 32 bytes base64 (256-bit)");
  }
  return key;
}

export function encryptString(plaintext: string): string {
  if (plaintext === undefined || plaintext === null) return plaintext as any;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  // Format: ENC::<b64(iv)>:<b64(ciphertext)>:<b64(tag)>
  const ivB64 = iv.toString("base64");
  const ctB64 = ciphertext.toString("base64");
  const tagB64 = authTag.toString("base64");
  return `ENC::${ivB64}:${ctB64}:${tagB64}`;
}

export function decryptString(serialized: string): string {
  if (serialized === undefined || serialized === null) return serialized as any;
  if (typeof serialized !== "string") return serialized as any;
  if (!serialized.startsWith("ENC::")) return serialized;
  const parts = serialized.slice(5).split(":");
  if (parts.length !== 3) {
    return serialized; // tolerate legacy/corrupt values
  }
  try {
    const [ivB64, dataB64, tagB64] = parts;
    if (!ivB64 || !dataB64 || !tagB64) {
      return serialized; // Missing parts
    }
    const iv = Buffer.from(ivB64, "base64");
    const data = Buffer.from(dataB64, "base64");
    const tag = Buffer.from(tagB64, "base64");
    const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
    decipher.setAuthTag(tag);
    const plaintext = Buffer.concat([decipher.update(data), decipher.final()]);
    return plaintext.toString("utf8");
  } catch {
    return serialized; // fail-open to avoid crashing reads
  }
}

export function isEncrypted(value: unknown): boolean {
  return typeof value === "string" && value.startsWith("ENC::");
}


