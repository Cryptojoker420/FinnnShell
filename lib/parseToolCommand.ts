// lib/parseToolCommand.ts
import { nanoid } from "nanoid";
import { COMMANDS } from "./commandRegistry";

// Central command map for all tool commands
const COMMAND_MAP: Record<string, string> = {
  chart: "crypto-chart",
  price: "crypto-price",
  news: "crypto-news",
  screener: "crypto-screener",
  heatmap: "market-heatmap",
  overview: "market-overview",
  trending: "market-trending",
  marketScreener: "market-screener",
  tape: "ticker-tape",
};

const NO_SYMBOL_COMMANDS = [
  "heatmap", "overview", "screener", "trending", "marketScreener"
];

const SYMBOL_OPTIONAL_COMMANDS = [
  "news"
];

const SYMBOL_REQUIRED_COMMANDS = [
  "chart", "price"
];

/**
 * Parses a user input string for tool commands, supporting both slash and natural language forms.
 * Returns { tool, symbol, id } if matched, or null otherwise.
 */
export function parseToolCommand(
  raw: string,
): { tool: string; symbol?: string; id: string } | null {
  // Build regex for all aliases
  const allAliases = COMMANDS.flatMap(cmd => cmd.aliases);
  const aliasPattern = allAliases.join("|");

  // Regex for slash commands, e.g. /chart $DOGE
  const slashPattern = new RegExp(`^/(${aliasPattern})\\s+\\$(\\w+)`, 'i');
  // Regex for slash commands with no symbol, e.g. /heatmap
  const slashNoSymbolPattern = new RegExp(`^/(${aliasPattern})$`, 'i');
  // Regex for natural language, e.g. show me a chart for $DOGE
  const nlPattern = new RegExp(`(${aliasPattern})\\s+(?:for\\s+)?\\$(\\w+)`, 'i');

  // Try slash command with symbol
  const slashMatch = raw.match(slashPattern);
  if (slashMatch) {
    const alias = slashMatch[1].toLowerCase();
    const symbol = slashMatch[2].toUpperCase();
    const cmd = COMMANDS.find(c => c.aliases.includes(alias));
    if (cmd && cmd.requiresSymbol) {
      return { tool: cmd.name, symbol, id: nanoid() };
    }
    if (cmd && !cmd.requiresSymbol) {
      return { tool: cmd.name, symbol, id: nanoid() };
    }
  }

  // Try natural language
  const nlMatch = raw.match(nlPattern);
  if (nlMatch) {
    const alias = nlMatch[1].replace(/\s+/, "").toLowerCase();
    const symbol = nlMatch[2].toUpperCase();
    const cmd = COMMANDS.find(c => c.aliases.includes(alias));
    if (cmd) {
      return { tool: cmd.name, symbol, id: nanoid() };
    }
  }

  // Try slash command with no symbol
  const slashNoSymbolMatch = raw.match(slashNoSymbolPattern);
  if (slashNoSymbolMatch) {
    const alias = slashNoSymbolMatch[1].toLowerCase();
    const cmd = COMMANDS.find(c => c.aliases.includes(alias));
    if (cmd && !cmd.requiresSymbol) {
      return { tool: cmd.name, id: nanoid() };
    }
  }

  return null;
}