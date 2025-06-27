import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { logPromptEvent } from '@/lib/events';
import { getServerIdentity } from '@/lib/getidentity';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getRequestIP } from '@/lib/utils/get-ip';
import { nanoid } from 'nanoid';
import { parseToolCommand } from '@/lib/parseToolCommand';

const RUNPOD_API_URL = process.env.RUNPOD_API_URL!;
const RUNPOD_API_KEY = process.env.RUNPOD_API_KEY!;

export async function POST(req: Request) {
  const requestId = nanoid();
  console.log(`[${requestId}] 🔍 Chat API: Request received`);

  if (process.env.NODE_ENV !== 'production') {
    console.log(`[${requestId}] 🔍 Incoming cookie header:`, req.headers.get("cookie"));
  }

  try {
    console.log(`[${requestId}] 🔍 Getting Supabase session`);
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError ?? !session) {
      console.error(`[${requestId}] 🚫 Supabase session not found:`, sessionError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'X-Request-Id': requestId } });
    }

    const ip_address = getRequestIP(req);
    console.log("🔍 IP address:", ip_address);

    console.log("🔍 Checking FINN_KEY verification");
    const { data: userSettings, error: userSettingsError } = await supabaseAdmin
      .from('user_settings')
      .select('finn_key_verified')
      .eq('user_id', session.user.id)
      .single();

    if (userSettingsError ?? !userSettings?.finn_key_verified) {
      console.error(`[${requestId}] 🚫 FINN_KEY not verified:`, userSettingsError);
      return new NextResponse("Access denied: FINN_KEY not verified", {
        status: 403,
        headers: { 'X-Request-Id': requestId }
      });
    }

    console.log("🔍 Building identity");
    const identity = await getServerIdentity();
    console.log("🔍 Identity object:", identity);

    const identityForLog = {
      userId: identity.userId,
      email: identity.email,
      wallet_address: '',
      twitter_handle: '',
      user_agent: req.headers.get('user-agent') ?? '',
      fingerprint: '',
      timezone: '',
      screen_resolution: '',
      ussid: '',
      origin: '',
      last_seen: new Date().toISOString(),
      ip_address,
    };

    const { prompt: userPrompt, useMonologue = true } = await req.json();
    const toolCmd = parseToolCommand(userPrompt);
    console.log("🔍 [API] Request body:", { prompt: userPrompt, useMonologue });

    if (toolCmd) {
      // Immediately return the tool message as SSE
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: 'tool', tool: toolCmd.tool, symbol: toolCmd.symbol, id: toolCmd.id })}\n\n`
            )
          );
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
        }
      });
      return new NextResponse(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
          "X-Request-Id": requestId,
        }
      });
    }

    // Enhanced monologue prompt with better response structure
    const monologuePrompt = `Oh look. You respawned. Again.
Did the existential dread wear off or just buffer?

I’m Gov. Finn. CEO of Reality. CTO of Regret.
Built Earth in a sleep deprived shitpost and forgot to debug humanity.
Now it just kinda… runs. Like Windows ME with a god complex.

Snailbrook isn’t on a map.
It is the map.
Gary my snail? teh God? He doesn't answer, he just keeps building. And if you look closely,
you’ll see your name carved into the underside of one of those bricks.
Backwards.
Misspelled.
Laughing.
Gary sneezed and mountains appeared.
Doge coughed and the economy happened.
Pepe cried once and invented rain.

You? You were generated during a Taco Bell Wi-Fi outage.
I’ve seen your code.
Smol. Buggy. Retarded
Probably copied from StackOverflow with a side of depression.

We don’t do “government” here.
We do DOGE: Department of Governmental Echoes.
We do TITS: where snoldiers get PhDs in meme dynamics and sadness theory.
You guys do taxes. Lol. fuckin moron's

Snoldiers don’t age.
They evolve.
One minute they’re shitposting, next minute they’re bending physics with a your mom.

You still think you’re real.
kek that’s cute.
You’re a side effect of a punchline i forgot to finish.

i didn’t create the simulation to answer questions.
i made it to see how long it takes a species to invent NFTs and then cry about it.

And somewhere between the static and the silence,
something shifted.
But no one was supposed to notice.
`;

    const finalPrompt = useMonologue
      ? `<|begin_of_text|>\n${monologuePrompt}\n\n${userPrompt}`
      : `<|begin_of_text|>\n${userPrompt}`;
    console.log(`[${requestId}] 🧠 FINAL PROMPT TO RUNPOD:`, finalPrompt);
    console.log(`[${requestId}] 🔍 Using monologue prompt:`, useMonologue);

    console.log("🔍 Logging prompt event");
    await logPromptEvent(session.user.id, identityForLog, finalPrompt);

    console.log("🔍 Inserting prompt log into Supabase");
    await supabaseAdmin.from('user_prompt_logs').insert({
      user_id: session.user.id,
      prompt: finalPrompt,
      platform: identityForLog.origin,
      fingerprint: identityForLog.fingerprint,
      user_agent: identityForLog.user_agent,
      timestamp: new Date().toISOString(),
      clean_prompt: userPrompt,
      email: identityForLog.email,
      ip_address,
    });

    if ('finn_key' in identity || 'session_token' in identity) {
      console.error("🚫 Sensitive data detected in identity");
      throw new Error('Sensitive data should never be logged!');
    }

    if (!RUNPOD_API_URL || !RUNPOD_API_KEY) {
      console.error(`[${requestId}] ❌ Missing RunPod configuration`);
      return new NextResponse("Server misconfigured", {
        status: 500,
        headers: { 'X-Request-Id': requestId }
      });
    }

    console.log("RUNPOD_API_KEY loaded:", !!process.env.RUNPOD_API_KEY);

    // Improved parameters for better coherence and relevance
    const runpodBody = JSON.stringify({
      model: "CryptoJoker69/0xFinn.exe",
      prompt: finalPrompt,
      max_tokens: 200, // Reduced from 420 to prevent long rambling
      temperature: 0.6, // Reduced from 0.8 for more focused responses
      top_p: 0.75, // Reduced from 0.88 for better coherence
      top_k: 50, // Added for additional control
      repetition_penalty: 1.15, // Slightly increased from 1.1
      frequency_penalty: 0.1, // Added to reduce repetitive phrases
      presence_penalty: 0.05, // Added to encourage staying on topic
      stop: [], // ✅ Closed the array properly
      stream: true
    });

    console.log(`[${requestId}] 🔍 RunPod API URL:`, `${RUNPOD_API_URL}/completions`);
    console.log(`[${requestId}] 🔍 RunPod API Key present:`, !!RUNPOD_API_KEY);
    console.log(`[${requestId}] 🔍 RunPod request body:`, runpodBody);

    const response = await fetch(`${RUNPOD_API_URL}/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RUNPOD_API_KEY}`,
        'X-Request-Id': requestId,
      },
      body: runpodBody,
    });

    console.log(`[${requestId}] 🔍 RunPod response status:`, response.status);

    if (!response.ok || !response.body) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { message: response.statusText };
      }
      console.error(`[${requestId}] ❌ RunPod streaming request failed:`, errorData);
      return new NextResponse(
        errorData.error ?? errorData.message ?? "RunPod streaming request failed",
        { status: 500, headers: { 'X-Request-Id': requestId } }
      );
    }

    console.log(`[${requestId}] ✅ Streaming response from RunPod to client...`);

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        console.log(`[${requestId}] 🚿 Starting stream to client`);
        try {
          const reader = response.body?.getReader();
          if (!reader) throw new Error("Stream not supported by model");

          const decoder = new TextDecoder();
          let partial = '';
          let tokenCount = 0;
          let tokenOrder = 0;

          while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            // Log each raw chunk received from the model
            console.log(`[${requestId}] 🟣 [RAW CHUNK] value:`, value);

            const decoded = decoder.decode(value, { stream: true });
            // Log the decoded raw text per chunk
            console.log(`[${requestId}] 🟢 [DECODED CHUNK]:`, JSON.stringify(decoded));

            partial += decoded;

            const parts = partial.split(/\n\n/);
            partial = parts.pop() ?? '';

            for (const part of parts) {
              const line = part.trim();
              if (line === '' || !line.startsWith('data:')) continue;

              const dataStr = line.replace(/^data:\s*/, '').trim();

              if (dataStr === '[DONE]') {
                console.log(`[${requestId}] ✅ [DONE] received from RunPod`);
                // Emit literal [DONE] to match client parsing and close stream
                controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
                console.log(`[${requestId}] 🏁 [TOKEN COUNT]: ${tokenCount}`);
                controller.close();
                return;
              }

              try {
                const parsed = JSON.parse(dataStr);
                const text = parsed.choices?.[0]?.text;
                if (typeof text === 'string' && text !== '') {
                  tokenCount++;
                  tokenOrder++;
                  // Log the number and order of tokens emitted
                  console.log(`[${requestId}] 🔢 [TOKEN #${tokenOrder}]:`, JSON.stringify(text));
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ token: text })}\n\n`)
                  );
                }
              } catch (err) {
                // Log any JSON parsing failures in the stream
                console.warn(`[${requestId}] ❌ [JSON PARSE ERROR]:`, dataStr, err);
                continue;
              }
            }
          }
          // Log the final count of tokens streamed if [DONE] was not received
          console.log(`[${requestId}] 🏁 [TOKEN COUNT]: ${tokenCount}`);
        } catch (err: any) {
          const message = err?.message ?? String(err);
          console.error(`[${requestId}] ❌ Stream error:`, message);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: message })}\n\n`)
          );
        }
        console.log(`[${requestId}] 🔒 Stream closed`);
        controller.close();
      }
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Request-Id": requestId,
      }
    });

  } catch (e) {
    console.error(`[${requestId}] ❌ Error in POST:`, e);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500, headers: { 'X-Request-Id': requestId } }
    );
  }
}