export function RiskSummary({ warnings }: { warnings: string[] }) {
  return (
    <div className="rounded-lg border border-rose-200 bg-rose-50 p-4">
      <h3 className="font-bold text-rose-900">리스크 확인</h3>
      <ul className="mt-2 space-y-2 text-sm leading-6 text-rose-800">
        {warnings.map((warning) => (
          <li key={warning}>- {warning}</li>
        ))}
      </ul>
    </div>
  );
}
