#!/usr/bin/env node
// Lightweight script to stream responses from your RunPod serverless endpoint.
// Usage: RUNPOD_API_KEY=... FINN_KEY=... ./stream.mjs

import fetch from "node-fetch";

async function main() {
  const res = await fetch("https://api.runpod.ai/v2/o3pzo0fls5laqo/run", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.RUNPOD_API_KEY}`,
    },
    body: JSON.stringify({
      input: { prompt: "", finn_key: process.env.FINN_KEY },
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error(`RunPod error: ${err}`);
    process.exit(1);
  }

  // Node-fetch returns a Node.js Readable stream; use async iteration instead of getReader()
  const decoder = new TextDecoder();
  let buffer = "";
  for await (const chunk of res.body) {
    buffer += decoder.decode(chunk, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() || "";

    for (const event of events) {
      if (!event.startsWith("data:")) continue;
      const json = JSON.parse(event.replace(/^data:\s*/, ""));
      if (json.token) {
        process.stdout.write(json.token);
      } else if (json.error) {
        console.error(`\nError: ${json.error}`);
        process.exit(1);
      }
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});