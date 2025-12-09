import { Loader2 } from 'lucide-react';

export default function SalesMovementLoading() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="h-9 w-64 bg-muted rounded animate-pulse" />
        <div className="h-5 w-96 bg-muted rounded animate-pulse mt-2" />
      </div>

      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    </div>
  );
}
