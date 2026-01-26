import { Schema } from "mongoose";
import { decryptString, encryptString, isEncrypted } from "@/lib/crypto";

type EncryptableFieldsOption = string[];

export interface FieldEncryptionOptions {
  fields: EncryptableFieldsOption;
}

/**
 * Simple field-level encryption plugin (AES-256-GCM via lib/crypto).
 * - Encrypts configured string fields before save/update.
 * - Decrypts on find/findOne/findById results.
 * Note: Do NOT use these fields in Mongo queries since values are stored encrypted.
 */
export default function fieldEncryptionPlugin(schema: Schema, options: FieldEncryptionOptions) {
  const fields = Array.isArray(options?.fields) ? options.fields : [];
  if (fields.length === 0) return;

  function encryptInDoc(doc: any) {
    for (const field of fields) {
      const value = doc.get(field);
      if (typeof value === "string" && value && !isEncrypted(value)) {
        doc.set(field, encryptString(value));
      }
    }
  }

  function decryptInDoc(doc: any) {
    if (!doc) return;
    for (const field of fields) {
      const value = doc.get ? doc.get(field) : doc[field];
      if (typeof value === "string" && isEncrypted(value)) {
        try {
          const plain = decryptString(value);
          if (doc.set) doc.set(field, plain);
          else doc[field] = plain;
        } catch (_) {
          // Tolerate corrupt/legacy values by leaving ciphertext as-is
        }
      }
    }
  }

  // On save
  schema.pre("save", function (next) {
    encryptInDoc(this);
    next();
  });

  // On update operations: findOneAndUpdate / updateOne / updateMany
  const updateHooks = ["findOneAndUpdate", "updateOne", "updateMany"] as const;
  for (const hook of updateHooks) {
    schema.pre(hook, function (next) {
      const update: any = this.getUpdate() || {};
      // Only handle $set for simplicity; extend as needed
      const set = update.$set || update;
      for (const field of fields) {
        const value = set[field];
        if (typeof value === "string" && value && !isEncrypted(value)) {
          set[field] = encryptString(value);
        }
      }
      if (update.$set) update.$set = set; else this.setUpdate(set);
      next();
    });
  }

  // Decrypt on find results
  function attachDecryptMiddleware(op: "find" | "findOne") {
    schema.post(op, function (result: any) {
      if (!result) return result;
      if (Array.isArray(result)) {
        for (const doc of result) decryptInDoc(doc);
      } else {
        decryptInDoc(result);
      }
      return result;
    });
  }

  attachDecryptMiddleware("find");
  attachDecryptMiddleware("findOne");
}


