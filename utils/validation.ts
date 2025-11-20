/**
 * Input validation utilities
 */

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function sanitizeText(text: string): string {
  return text
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
}

export function validatePrompt(prompt: string, maxLength: number = 1000): {
  isValid: boolean;
  error?: string;
} {
  const trimmed = prompt.trim();
  
  if (!trimmed) {
    return { isValid: false, error: 'Prompt cannot be empty' };
  }
  
  if (trimmed.length > maxLength) {
    return { isValid: false, error: `Prompt must be less than ${maxLength} characters` };
  }
  
  return { isValid: true };
}

export function validateImageUri(uri: string): boolean {
  if (!uri) return false;
  
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic'];
  const lowerUri = uri.toLowerCase();
  
  return (
    imageExtensions.some((ext) => lowerUri.includes(ext)) ||
    lowerUri.startsWith('data:image/') ||
    lowerUri.startsWith('file://') ||
    lowerUri.startsWith('content://')
  );
}
