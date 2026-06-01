import { Badge } from "@/components/ui/Badge";
import { strategyTypeLabels } from "@/lib/constants";
import type { StrategyType } from "@/lib/types";

export function StrategyTypeBadge({ type }: { type: StrategyType }) {
  return <Badge tone="blue">{strategyTypeLabels[type]}</Badge>;
}
