import { ExternalLink } from "@/components/external-link";
import { useEffect, useState } from "react";
import {
  getEntropySeed,
  getFinnPersonaVariant,
  FinnPersonaVariant,
} from "../utils/finnEntropy";

export function EmptyScreen() {
  const [variant, setVariant] = useState<FinnPersonaVariant | null>(null);

  useEffect(() => {
    const entropy = getEntropySeed(); // get a number
    const persona = getFinnPersonaVariant(entropy); // get a Finn persona
    console.log("🧠 Loaded Finn persona:", persona);
    setVariant(persona);
  }, []);

  if (!variant) return <div>Loading shell variant…</div>;

  return (
    <div className="mx-auto max-w-2xl mt-10 mb-8 px-4">
      <div className="flex flex-col gap-2 border bg-background p-8 rounded-md shadow-md">
        <h1 className="text-lg font-semibold">{variant.title}</h1>
        <p className="leading-normal text-sm">{variant.subtitle}</p>
        <p className="leading-normal text-sm">
          Powered by{" "}
          <ExternalLink href="https://sdk.vercel.ai">Gary</ExternalLink>,{" "}
          <ExternalLink href="https://tradingview.com">
            TradingView Widgets
          </ExternalLink>
          , and <ExternalLink href="">LLaMA 3.1–8B</ExternalLink>. Forged in
          irony. Fueled by entropy.
        </p>
        <p className="leading-normal text-sm italic text-muted-foreground">
          {variant.footer}
        </p>
      </div>
    </div>
  );
}
