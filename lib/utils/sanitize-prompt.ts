export function sanitizePrompt(prompt: string): string {
  // Remove script tags and trim whitespace
  return prompt.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '').trim();
} 