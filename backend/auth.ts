// Authentication helpers using built-in Web Crypto API

export async function hashPassword(password: string, salt?: string): Promise<{ hash: string; salt: string }> {
  const generatedSalt = salt || crypto.randomUUID().replace(/-/g, "");
  const encoder = new TextEncoder();
  const data = encoder.encode(password + generatedSalt + "hiyori_salt_pepper");
  
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

  return { hash: hashHex, salt: generatedSalt };
}

export async function verifyPassword(password: string, hash: string, salt: string): Promise<boolean> {
  const result = await hashPassword(password, salt);
  return result.hash === hash;
}

export function generateToken(): string {
  const randomBytes = new Uint8Array(32);
  crypto.getRandomValues(randomBytes);
  const tokenHex = Array.from(randomBytes).map((b) => b.toString(16).padStart(2, "0")).join("");
  return `hy_${tokenHex}`;
}

