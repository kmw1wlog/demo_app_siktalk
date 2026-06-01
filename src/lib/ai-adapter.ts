import { parseStrategyIdea } from "./strategy-parser";
import type { StrategyCard } from "./types";

export type StrategyParserAdapter = {
  parse(rawIdea: string): Promise<StrategyCard>;
};

export const mockAiAdapter: StrategyParserAdapter = {
  async parse(rawIdea: string) {
    return parseStrategyIdea(rawIdea);
  },
};
