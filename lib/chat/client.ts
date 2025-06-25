export async function streamChatResponse(
  prompt: string,
  onToken: (token: string) => void,
  onError: (error: string) => void,
  onTool?: (toolMsg: { type: string; tool: string; symbol: string; id: string }) => void,
  options?: Readonly<{
    model?: string;
    max_tokens?: number;
    temperature?: number;
    top_p?: number;
    repetition_penalty?: number;
    useMonologue?: boolean;
  }>
): Promise<void> {
  console.log("=== streamChatResponse CALLED ===");
  console.log("🔍 [streamChatResponse] Starting with prompt:", prompt);

  let requestId: string | null = null;

  if (!prompt || typeof prompt !== 'string') {
    console.error("❌ [streamChatResponse] Invalid prompt:", prompt);
    onError("Missing or invalid prompt");
    return;
  }

  const baseUrl =
    typeof window !== 'undefined' && window.location.origin
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const url = `${baseUrl}/api/chat`;
  console.log("🔍 [URL] Final URL:", url);

  try {
    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify({ prompt, ...options }),
    });

    requestId = response.headers.get('x-request-id') ?? null;
    console.log(`[streamChatResponse][${requestId}] 📥 Response received`);
    console.log(`[streamChatResponse][${requestId}] Status: ${response.status} ${response.statusText}`);

    if (!response.ok || !response.body) {
      const err = await response.text();
      throw new Error(`API Error: ${err}`);
    }

    await processStream(response.body, onToken, onError, onTool, requestId);
  } catch (err: any) {
    console.error(`[streamChatResponse][${requestId}] ❌ Stream error:`, err);
    onError(err.message ?? "Unknown streaming error");
  }
}

async function processStream(
  body: ReadableStream<Uint8Array>,
  onToken: (token: string) => void,
  onError: (error: string) => void,
  onTool: ((toolMsg: { type: string; tool: string; symbol: string; id: string }) => void) | undefined,
  requestId: string | null
) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      console.log(`[streamChatResponse][${requestId}] ✅ Stream complete`);
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";

    for (const part of parts) {
      if (!part.startsWith("data:")) continue;

      const raw = part.replace(/^data:\s*/, "");
      const trimmed = raw.trim();
      if (trimmed === "[DONE]") {
        console.log(`[streamChatResponse][${requestId}] ✅ Stream termination detected`);
        return;
      }
      let parsed: any;
      try {
        parsed = JSON.parse(trimmed);
      } catch (err) {
        console.error(`[streamChatResponse][${requestId}] ❌ Failed to parse JSON`, trimmed, err);
        onError("Failed to parse server response");
        return;
      }
      // Tool envelopes from API
      if (parsed.type === "tool") {
        if (onTool) onTool(parsed);
        continue;
      }
      // Stream content tokens
      if (parsed.done === true) {
        console.log(`[streamChatResponse][${requestId}] ✅ Stream termination detected`);
        return;
      }
      const token = parsed.token ?? parsed.choices?.[0]?.delta?.content ?? parsed.choices?.[0]?.text;
      if (typeof token === "string") {
        onToken(token);
      } else if (parsed.error) {
        onError(parsed.error);
        return;
      }
    }
  }
}