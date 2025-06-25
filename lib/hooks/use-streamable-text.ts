import { type StreamableValue, readStreamableValue } from "ai/rsc";
import { useEffect, useState } from "react";

export const useStreamableText = (
  content: string | StreamableValue<string>,
) => {
  const [rawContent, setRawContent] = useState(
    typeof content === "string" ? content : "",
  );

  useEffect(() => {
    if (typeof content === 'string') {
      // Reset state on new string content
      setRawContent(content);
      return;
    }
    (async () => {
      let value = '';
      for await (const delta of readStreamableValue(content)) {
        if (typeof delta === 'string') {
          value += delta;
          setRawContent(value);
        }
      }
    })();
  }, [content]);

  return rawContent;
};
