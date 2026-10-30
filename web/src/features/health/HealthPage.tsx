import { useHealth } from "./useHealth";

export function HealthPage() {
  const { data, error, isPending, isFetching } = useHealth();

  let status: { label: string; dot: string };
  if (isPending) status = { label: "Checking…", dot: "bg-gray-400" };
  else if (error) status = { label: error.message, dot: "bg-red-500" };
  else status = { label: `API up, database ${data.db}`, dot: "bg-green-500" };

  return (
    <main className="flex min-h-svh items-center justify-center bg-background p-4 text-foreground">
      <div className="w-full max-w-sm rounded-xl border bg-card p-6 text-card-foreground shadow-sm">
        <h1 className="text-lg font-semibold">Tempah</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          GET /api/health {isFetching && "· refreshing"}
        </p>

        <div className="mt-4 flex items-center gap-2">
          <span className={`size-2.5 rounded-full ${status.dot}`} />
          <span className="text-sm font-medium">{status.label}</span>
        </div>

        {data && (
          <pre className="mt-4 rounded-md bg-muted p-3 font-mono text-xs">
            {JSON.stringify(data, null, 2)}
          </pre>
        )}
      </div>
    </main>
  );
}
