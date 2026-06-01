import { GLOBAL_DISCLAIMER } from "@/lib/constants";

export function DisclaimerBanner({ text = GLOBAL_DISCLAIMER }: { text?: string }) {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
      {text}
    </div>
  );
}
