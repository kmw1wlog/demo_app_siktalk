export function StrategyConditionBlock({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-bold text-slate-950">{title}</h3>
      <ol className="space-y-2">
        {items.map((item, index) => (
          <li key={`${title}-${item}`} className="flex gap-2 text-sm leading-6 text-slate-700">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-slate-100 text-xs font-bold text-slate-500">
              {index + 1}
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
