import { StrategyCard } from "./StrategyCard";
import type { StrategyCard as StrategyCardType } from "@/lib/types";

export function StrategyCardList({
  strategies,
  compact,
}: {
  strategies: StrategyCardType[];
  compact?: boolean;
}) {
  return (
    <div className="space-y-4">
      {strategies.map((strategy) => (
        <StrategyCard key={strategy.id} strategy={strategy} compact={compact} />
      ))}
    </div>
  );
}
