export interface PromptLogPayload {
  user_id: string;
  prompt: string;
  response: string;
  memory_used?: string;
  platform?: string;
  fingerprint?: string;
  user_agent?: string;
  timestamp: string; // ISO string
  clean_prompt?: string;
  email?: string;
}
