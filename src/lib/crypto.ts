import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
// Em produção, a chave precisa ter exatamente 32 bytes (256 bits).
const SECRET_KEY = process.env.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef';

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(SECRET_KEY, 'utf-8'), iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag().toString('hex');
  
  // Retorna iv:authTag:encryptedText
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

export function decrypt(hash: string): string {
  const [ivHex, authTagHex, encryptedText] = hash.split(':');
  
  if (!ivHex || !authTagHex || !encryptedText) {
    throw new Error('Formato de hash inválido.');
  }

  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(SECRET_KEY, 'utf-8'), iv);
  
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
